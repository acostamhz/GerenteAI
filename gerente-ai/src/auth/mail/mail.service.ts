import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false, // true solo si usas puerto 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(destinatario: string, nombre: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verificar-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: destinatario,
        subject: 'Verifica tu cuenta en GerenteAI',
        html: `
          <p>Hola ${nombre},</p>
          <p>Gracias por registrarte. Verifica tu correo haciendo clic en el siguiente enlace (válido por 24 horas):</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        `,
      });
    } catch (error) {
      // No lanzamos el error: si falla el envío, el registro ya se completó (RN-035 / FA-04 del documento).
      // El usuario podría solicitar un reenvío más adelante.
      this.logger.error(`No se pudo enviar el correo de verificación a ${destinatario}`, error);
    }
  }
  async sendPasswordResetEmail(destinatario: string, nombre: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: destinatario,
        subject: 'Restablece tu contraseña en GerenteAI',
        html: `
          <p>Hola ${nombre},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace es válido por 1 hora:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Si no solicitaste esto, ignora este correo — tu contraseña actual sigue siendo válida.</p>
        `,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo de restablecimiento a ${destinatario}`, error);
    }
  }
  async sendEmailChangeConfirmation(destinatarioNuevo: string, nombre: string, token: string) {
    const confirmUrl = `${process.env.FRONTEND_URL}/confirmar-cambio-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: destinatarioNuevo,
        subject: 'Confirma tu nuevo correo en GerenteAI',
        html: `
          <p>Hola ${nombre},</p>
          <p>Recibimos una solicitud para asociar este correo a tu cuenta. Confirma haciendo clic (válido por 1 hora):</p>
          <p><a href="${confirmUrl}">${confirmUrl}</a></p>
          <p>Si no solicitaste esto, ignora este correo.</p>
        `,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar la confirmación de cambio de correo a ${destinatarioNuevo}`, error);
    }
  }
}