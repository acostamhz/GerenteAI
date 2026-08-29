import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { isIP } from 'net';
import { promises as dns } from 'dns';

interface CorreoAEnviar {
  destinatario: string;
  asunto: string;
  html: string;
  /** Para el log cuando falla: qué correo era, sin repetir el asunto. */
  descripcion: string;
}

interface Remitente {
  email: string;
  nombre?: string;
}

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Resuelve el host SMTP a una dirección IPv4 concreta.
   *
   * nodemailer consulta los registros A y AAAA y luego elige **una al azar**
   * entre ambas familias (`addresses[Math.floor(Math.random() * length)]` en
   * lib/shared/index.js). El contenedor de Render no tiene ruta IPv6, así que
   * cuando salía elegida una AAAA el envío moría al instante con ENETUNREACH, y
   * cuando salía una A funcionaba. De ahí que fallara de forma intermitente.
   *
   * Entregándole una IP ya resuelta, nodemailer se salta su propia resolución
   * (comprueba `net.isIP` antes de consultar el DNS) y deja de haber sorteo.
   * `servername` conserva el nombre real para que el certificado TLS valide.
   *
   * Se usa `lookup` y no `resolve4` a propósito: `resolve4` habla directamente
   * con el servidor DNS por el puerto 53, que en entornos restringidos está
   * cerrado (aquí mismo devuelve ECONNREFUSED). `lookup` pasa por el resolutor
   * del sistema, el mismo que usa el resto del contenedor.
   *
   * Se resuelve en cada envío en vez de cachear: una consulta DNS son
   * milisegundos, aquí se mandan pocos correos, y así no hay que decidir cuándo
   * invalidar una IP que dejó de servir.
   */
  private async resolverHost(): Promise<{ host: string; servername?: string }> {
    const host = process.env.SMTP_HOST ?? '';

    // Si ya viene una IP, no hay nada que resolver.
    if (!host || isIP(host)) {
      return { host };
    }

    try {
      const { address } = await dns.lookup(host, { family: 4 });
      if (address) {
        return { host: address, servername: host };
      }
    } catch (error) {
      // Si la resolución falla, se deja el nombre y que nodemailer lo intente:
      // el envío puede fallar, pero no por culpa de esta optimización.
      this.logger.warn(
        `No se pudo resolver ${host} a IPv4; se usará el nombre tal cual`,
        error,
      );
    }

    return { host };
  }

  private async crearTransporte(): Promise<nodemailer.Transporter> {
    const { host, servername } = await this.resolverHost();

    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false, // true solo si usas puerto 465

      // Al conectar contra una IP, el certificado se valida contra este nombre
      // y no contra la dirección; sin esto, el TLS fallaría por SNI.
      tls: servername ? { servername } : undefined,

      /**
       * Sin esto rigen los valores de fábrica de nodemailer, que esperan dos
       * minutos antes de rendirse. Diez segundos sobran para un SMTP que
       * responde, y convierten una caída en un fallo rápido en lugar de en una
       * petición colgada.
       */
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * `SMTP_FROM` viene como `GerenteAI <lukaai.wpp@gmail.com>`. Brevo necesita el
   * nombre y el correo por separado, así que se parte aquí en vez de pedir dos
   * variables de entorno nuevas para un dato que ya existe.
   */
  private remitente(): Remitente {
    const bruto = (process.env.SMTP_FROM ?? '').trim();
    const conNombre = /^(.*?)\s*<([^>]+)>$/.exec(bruto);

    if (!conNombre) {
      return { email: bruto };
    }
    return {
      email: conNombre[2].trim(),
      nombre: conNombre[1].trim() || undefined,
    };
  }

  /**
   * Envío por la API HTTP de Brevo.
   *
   * Es la vía de producción: Render tiene cerrada la salida por los puertos de
   * SMTP (el log mostraba ETIMEDOUT en el paso CONN, tanto contra Gmail como
   * contra cualquier otro relay), y esta petición va por HTTPS al 443, que es el
   * mismo puerto del tráfico web normal y está abierto.
   */
  private async enviarPorBrevo(
    apiKey: string,
    { destinatario, asunto, html }: CorreoAEnviar,
  ) {
    const de = this.remitente();

    const respuesta = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: de.email, name: de.nombre },
        to: [{ email: destinatario }],
        subject: asunto,
        htmlContent: html,
      }),
      // Sin esto la petición podría quedarse colgada indefinidamente.
      signal: AbortSignal.timeout(10_000),
    });

    if (!respuesta.ok) {
      // El cuerpo se lee como texto y no como JSON: cuando Brevo responde con
      // un error de infraestructura devuelve HTML, y ahí un `.json()` fallaría
      // tapando el error real con uno de parseo.
      const detalle = await respuesta.text();
      throw new Error(`Brevo respondió ${respuesta.status}: ${detalle}`);
    }
  }

  /** Envío por SMTP. Sirve en local, donde el puerto 587 no está bloqueado. */
  private async enviarPorSmtp({ destinatario, asunto, html }: CorreoAEnviar) {
    const transporte = await this.crearTransporte();
    await transporte.sendMail({
      from: process.env.SMTP_FROM,
      to: destinatario,
      subject: asunto,
      html,
    });
  }

  /**
   * Un fallo de envío no tumba la operación que lo originó: la cuenta ya quedó
   * creada y el usuario puede pedir el reenvío. Queda en el log, que es donde
   * hay que mirar cuando alguien reporta que no le llegó el correo.
   *
   * La vía la decide `BREVO_API_KEY`: si está definida se usa la API, y si no,
   * SMTP. Así producción sale por Brevo sin que haya que tocar el entorno local,
   * donde SMTP funciona y no gasta cuota.
   */
  private async enviar(correo: CorreoAEnviar) {
    const apiKey = process.env.BREVO_API_KEY?.trim();

    try {
      if (apiKey) {
        await this.enviarPorBrevo(apiKey, correo);
      } else {
        await this.enviarPorSmtp(correo);
      }
    } catch (error) {
      this.logger.error(
        `No se pudo enviar ${correo.descripcion} a ${correo.destinatario}`,
        error,
      );
    }
  }

  async sendVerificationEmail(
    destinatario: string,
    nombre: string,
    token: string,
  ) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verificar-email?token=${token}`;

    await this.enviar({
      destinatario,
      descripcion: 'el correo de verificación',
      asunto: 'Verifica tu cuenta en GerenteAI',
      html: `
          <p>Hola ${nombre},</p>
          <p>Gracias por registrarte. Verifica tu correo haciendo clic en el siguiente enlace (válido por 24 horas):</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        `,
    });
  }

  async sendPasswordResetEmail(
    destinatario: string,
    nombre: string,
    token: string,
  ) {
    const resetUrl = `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`;

    await this.enviar({
      destinatario,
      descripcion: 'el correo de restablecimiento',
      asunto: 'Restablece tu contraseña en GerenteAI',
      html: `
          <p>Hola ${nombre},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace es válido por 1 hora:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Si no solicitaste esto, ignora este correo — tu contraseña actual sigue siendo válida.</p>
        `,
    });
  }

  async sendEmailChangeConfirmation(
    destinatarioNuevo: string,
    nombre: string,
    token: string,
  ) {
    const confirmUrl = `${process.env.FRONTEND_URL}/confirmar-cambio-email?token=${token}`;

    await this.enviar({
      destinatario: destinatarioNuevo,
      descripcion: 'la confirmación de cambio de correo',
      asunto: 'Confirma tu nuevo correo en GerenteAI',
      html: `
          <p>Hola ${nombre},</p>
          <p>Recibimos una solicitud para asociar este correo a tu cuenta. Confirma haciendo clic (válido por 1 hora):</p>
          <p><a href="${confirmUrl}">${confirmUrl}</a></p>
          <p>Si no solicitaste esto, ignora este correo.</p>
        `,
    });
  }
}
