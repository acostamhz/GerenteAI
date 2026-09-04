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

  private construirPlantilla({
    titulo,
    nombre,
    mensajePrincipal,
    textoBoton,
    urlBoton,
    duracionValidez,
    notaSeguridad,
    badgeIcon,
    badgeBg = '#f0fdfa',
    badgeColor = '#0d9488',
    colorBoton = '#0d9488',
  }: {
    titulo: string;
    nombre: string;
    mensajePrincipal: string;
    textoBoton: string;
    urlBoton: string;
    duracionValidez?: string;
    notaSeguridad?: string;
    badgeIcon: string;
    badgeBg?: string;
    badgeColor?: string;
    colorBoton?: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b;">
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${titulo} - Luka AI
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          
          <!-- Encabezado con Paleta Luka AI -->
          <tr>
            <td style="background: linear-gradient(135deg, #090d16 0%, #0f172a 60%, #112a26 100%); padding: 34px 30px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 27px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                      Luka<span style="color: #2dd4bf;"> AI</span>
                    </span>
                    <div style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;">
                      Control Financiero & Gestión con IA
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido Central -->
          <tr>
            <td style="padding: 36px 36px 30px 36px;">
              <!-- Icono Badge -->
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; font-size: 26px; text-align: center; border: 1px solid rgba(20, 184, 166, 0.2);">
                  ${badgeIcon}
                </span>
              </div>

              <!-- Título -->
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #09090b; text-align: center; line-height: 1.3;">
                ${titulo}
              </h1>

              <!-- Saludo -->
              <p style="margin: 0 0 14px 0; font-size: 15px; color: #18181b; line-height: 1.6;">
                Hola <strong style="color: #09090b;">${nombre}</strong>,
              </p>

              <!-- Mensaje Principal -->
              <div style="margin: 0 0 24px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
                ${mensajePrincipal}
              </div>

              <!-- Botón CTA con el Teal/Esmeralda de Luka -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${urlBoton}" target="_blank" style="display: inline-block; background-color: ${colorBoton}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35); text-align: center;">
                      ${textoBoton}
                    </a>
                  </td>
                </tr>
              </table>

              ${
                duracionValidez
                  ? `
              <!-- Validez de tiempo con estética Luka -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #0f766e; text-align: center;">
                    ⏱️ <strong style="color: #134e4a;">Tiempo límite:</strong> Este enlace estará disponible por <strong>${duracionValidez}</strong>.
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Enlace alternativo si no abre el botón -->
              <div style="padding-top: 20px; border-top: 1px solid #f4f4f5; font-size: 12px; color: #71717a; line-height: 1.6;">
                <p style="margin: 0 0 6px 0;">Si el botón no funciona en tu dispositivo, copia y abre este enlace directamente en tu navegador:</p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${urlBoton}" style="color: #0d9488; text-decoration: underline;">${urlBoton}</a>
                </p>
              </div>

              ${
                notaSeguridad
                  ? `
              <!-- Nota de Seguridad -->
              <p style="margin: 22px 0 0 0; font-size: 12px; color: #71717a; line-height: 1.5; text-align: center;">
                🔒 ${notaSeguridad}
              </p>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Pie de página Luka AI -->
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #f4f4f5; padding: 22px 30px; text-align: center; font-size: 12px; color: #71717a; line-height: 1.5;">
              <p style="margin: 0 0 4px 0; font-weight: 500; color: #3f3f46;">
                Luka AI · Control & Finanzas Inteligentes
              </p>
              <p style="margin: 0;">
                Este es un mensaje automático de seguridad. Por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
      asunto: 'Verifica tu cuenta en Luka AI',
      html: this.construirPlantilla({
        titulo: '¡Bienvenido a Luka AI!',
        nombre,
        badgeIcon: '✉️',
        badgeBg: '#f0fdfa',
        badgeColor: '#0d9488',
        colorBoton: '#0d9488',
        mensajePrincipal:
          '<p style="margin: 0 0 12px 0;">Gracias por registrarte. Estás a un solo paso de empezar a controlar tus ventas, gastos e inventario con inteligencia artificial.</p><p style="margin: 0;">Para activar tu cuenta y asegurar tu acceso, confirma tu correo electrónico haciendo clic en el siguiente botón:</p>',
        textoBoton: 'Verificar mi cuenta',
        urlBoton: verificationUrl,
        duracionValidez: '24 horas',
        notaSeguridad:
          'Si tú no creaste una cuenta en Luka AI, puedes ignorar este mensaje con total seguridad.',
      }),
    });
  }

  /**
   * Aviso de que el plan está por vencer.
   *
   * Los tres correos de suscripción dicen lo mismo con distinto tono, y a
   * propósito son concretos sobre qué se pierde: "vence tu plan" no le dice nada
   * a un tendero, "vas a quedarte con una sola sede" sí.
   */
  async sendAvisoDeVencimiento(
    destinatario: string,
    nombre: string,
    negocio: string,
    plan: string,
    dias: number,
  ) {
    const cuando = dias === 1 ? 'mañana' : `en ${dias} días`;

    await this.enviar({
      destinatario,
      descripcion: 'el aviso de vencimiento',
      asunto: `Tu plan ${plan} vence ${cuando}`,
      html: `
          <p>Hola ${nombre},</p>
          <p>El plan <b>${plan}</b> de <b>${negocio}</b> vence ${cuando}.</p>
          <p>Si no lo renuevas, tu negocio pasa al plan Asistente: conservas toda
          tu información y sigues registrando ventas en tu primera sede, pero las
          sedes adicionales quedan en solo lectura y se desactivan los reportes
          por producto y de fiados.</p>
          <p><a href="${this.enlaceASuscripcion()}">Renovar mi plan</a></p>
        `,
    });
  }

  /** El plan ya venció: el negocio está operando como Asistente. */
  async sendPlanVencido(
    destinatario: string,
    nombre: string,
    negocio: string,
    plan: string,
  ) {
    await this.enviar({
      destinatario,
      descripcion: 'el aviso de plan vencido',
      asunto: `El plan ${plan} de ${negocio} venció`,
      html: `
          <p>Hola ${nombre},</p>
          <p>El plan <b>${plan}</b> de <b>${negocio}</b> venció y tu negocio
          quedó en el plan Asistente.</p>
          <p><b>No perdiste nada.</b> Tus ventas, tus clientes y tus fiados siguen
          ahí, y puedes consultarlos todos. Lo que se pausó es registrar
          movimientos en las sedes adicionales y los reportes Premium.</p>
          <p>Con volver a pagar se reactiva al instante.</p>
          <p><a href="${this.enlaceASuscripcion()}">Reactivar mi plan</a></p>
        `,
    });
  }

  /** Último recordatorio, una semana después. Después de este no se insiste más. */
  async sendSeguimientoDeVencimiento(
    destinatario: string,
    nombre: string,
    negocio: string,
    plan: string,
  ) {
    await this.enviar({
      destinatario,
      descripcion: 'el recordatorio de plan vencido',
      asunto: `${negocio} sigue en el plan Asistente`,
      html: `
          <p>Hola ${nombre},</p>
          <p>Hace una semana venció el plan <b>${plan}</b> de <b>${negocio}</b>.
          Todo tu historial sigue intacto y disponible.</p>
          <p>Cuando quieras retomar las sedes adicionales y los reportes, se
          reactiva desde tu panel.</p>
          <p><a href="${this.enlaceASuscripcion()}">Ver los planes</a></p>
          <p style="color:#666;font-size:12px">Este es el último recordatorio que
          te enviamos sobre este vencimiento.</p>
        `,
    });
  }

  private enlaceASuscripcion() {
    return `${process.env.FRONTEND_URL}/suscripcion`;
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
      asunto: 'Restablece tu contraseña en Luka AI',
      html: this.construirPlantilla({
        titulo: 'Restablece tu contraseña',
        nombre,
        badgeIcon: '🔐',
        badgeBg: '#fefce8',
        badgeColor: '#d97706',
        colorBoton: '#0d9488',
        mensajePrincipal:
          '<p style="margin: 0 0 12px 0;">Recibimos una solicitud para restablecer la contraseña de acceso a tu cuenta en <strong>Luka AI</strong>.</p><p style="margin: 0;">Para crear una nueva contraseña y recuperar tu acceso, haz clic en el botón a continuación:</p>',
        textoBoton: 'Restablecer mi contraseña',
        urlBoton: resetUrl,
        duracionValidez: '1 hora',
        notaSeguridad:
          'Si no solicitaste este cambio, no te preocupes: tu contraseña actual sigue siendo válida y segura. No se realizará ninguna acción sin este enlace.',
      }),
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
      asunto: 'Confirma tu nuevo correo en Luka AI',
      html: this.construirPlantilla({
        titulo: 'Confirma tu nuevo correo',
        nombre,
        badgeIcon: '🔄',
        badgeBg: '#f0fdfa',
        badgeColor: '#0d9488',
        colorBoton: '#0d9488',
        mensajePrincipal:
          '<p style="margin: 0 0 12px 0;">Recibimos una solicitud para asociar esta dirección de correo a tu cuenta en <strong>Luka AI</strong>.</p><p style="margin: 0;">Para confirmar y completar el cambio, haz clic en el siguiente botón:</p>',
        textoBoton: 'Confirmar este correo',
        urlBoton: confirmUrl,
        duracionValidez: '1 hora',
        notaSeguridad:
          'Si no solicitaste asociar este correo a tu cuenta, ignora este mensaje y tu correo actual se mantendrá sin cambios.',
      }),
    });
  }
}
