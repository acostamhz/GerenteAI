import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../services/prisma.service';
import { NegociosService } from '../services/negocios.service';
import { MailService } from './mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AsociarNegocioDto } from './dto/asociar-negocio.dto';
import { ReenviarVerificacionDto } from './dto/reenviar-verificacion.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CambiarEmailDto } from './dto/cambiar-email.dto';
import { ConfirmarCambioEmailDto } from './dto/confirmar-cambio-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly negociosService: NegociosService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          nombre: dto.nombre,
          telefono: dto.telefono,
          email: dto.email,
          password: hashedPassword,
        },
      });

      const verificationToken = this.jwtService.sign(
        {
          sub: usuario.id,
          type: 'email-verification',
        },
        {
          expiresIn: '24h',
        },
      );

      /**
       * El correo se dispara sin esperarlo: la respuesta no depende de que el
       * SMTP conteste. Antes se esperaba, y cuando el envio fallaba la peticion
       * quedaba colgada hasta agotar el timeout y aun asi respondia 201, o sea
       * que el usuario pagaba la espera de un fallo que ni se le informaba.
       *
       * Perder el correo no invalida la operacion: el registro ya se completo y
       * el usuario puede pedir el reenvio. MailService atrapa sus propios
       * errores y los deja en el log, asi que esto no puede quedar sin manejar.
       */
      void this.mailService.sendVerificationEmail(
        usuario.email,
        usuario.nombre,
        verificationToken,
      );

      // No se devuelve accessToken a propósito: si no se puede iniciar sesión sin
      // verificar el correo, tampoco debe entregarse una credencial válida aquí.
      // Antes sí lo devolvía, y con ese token se podía operar sin verificar nada.
      return {
        mensaje:
          'Cuenta creada. Revisa tu correo para activarla antes de iniciar sesión.',
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe una cuenta registrada con ese correo. Intenta iniciar sesión.',
        );
      }

      throw error;
    }
  }

  async verificarEmail(token: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException(
        'El enlace de verificación es inválido o expiró',
      );
    }

    if (payload.type !== 'email-verification') {
      throw new UnauthorizedException('Token inválido para esta operación');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.emailVerificado) {
      return {
        mensaje: 'Este correo ya había sido verificado anteriormente',
        usuarioId: usuario.id,
      };
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { emailVerificado: true },
    });

    return {
      mensaje: 'Correo verificado correctamente',
      usuarioId: usuario.id,
    };
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { negocios: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado en el sistema');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException(
        'Contraseña incorrecta, intente nuevamente',
      );
    }

    if (!usuario.emailVerificado) {
      throw new UnauthorizedException(
        'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
      );
    }

    const usuarioNegocio = usuario.negocios[0];

    return this.buildAuthResponse(
      usuario.id,
      usuario.nombre,
      usuarioNegocio?.negocioId ?? null,
      usuarioNegocio?.role ?? null,
      usuario.rolGlobal,
    );
  }

  async asociarNegocio(
    solicitanteId: string,
    rolGlobal: string,
    dto: AsociarNegocioDto,
  ) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: dto.negocioId },
    });
    if (!negocio) {
      throw new NotFoundException(
        'El negocio no se encontró en el sistema o no está registrado',
      );
    }

    // Sumar socios lo decide un dueño existente (o MASTER). El dueño inicial no pasa por aquí:
    // lo crea NegociosService.create al registrar el negocio, así que no hay bloqueo de arranque.
    await this.negociosService.verificarPropietario(
      solicitanteId,
      dto.negocioId,
      rolGlobal,
    );

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException('El usuario indicado no existe');
    }

    try {
      return await this.prisma.usuarioNegocio.create({
        data: {
          usuarioId: dto.usuarioId,
          negocioId: dto.negocioId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'El usuario ya está asociado a ese negocio',
        );
      }
      throw error;
    }
  }

  async removeUsuario(id: string, rolGlobal: string) {
    // Sin esta verificación, cualquier usuario autenticado podía borrar la cuenta de otro.
    if (rolGlobal !== 'MASTER') {
      throw new ForbiddenException(
        'Solo un usuario MASTER puede eliminar cuentas',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return this.prisma.usuario.delete({ where: { id } });
  }

  private buildAuthResponse(
    usuarioId: string,
    nombre: string,
    negocioId: string | null,
    role: string | null,
    rolGlobal: string,
  ) {
    // `type` distingue este token de los de verificación y reset, que se firman
    // con el mismo secreto. JwtStrategy solo acepta los de tipo 'session'.
    const payload = {
      sub: usuarioId,
      type: 'session',
      negocioId,
      role,
      rolGlobal,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      usuario: { id: usuarioId, nombre, negocioId, role, rolGlobal },
    };
  }

  async reenviarVerificacion(dto: ReenviarVerificacionDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!usuario) {
      throw new NotFoundException(
        'No existe una cuenta registrada con ese correo',
      );
    }

    // TODO: cuando exista `emailVerificado` en el schema, validar aquí:
    // if (usuario.emailVerificado) throw new ConflictException('Este correo ya fue verificado');

    const verificationToken = this.jwtService.sign(
      { sub: usuario.id, type: 'email-verification' },
      { expiresIn: '24h' },
    );

    // Sin esperar, por lo mismo que en register.
    void this.mailService.sendVerificationEmail(
      usuario.email,
      usuario.nombre,
      verificationToken,
    );

    return {
      mensaje:
        'Correo de verificación reenviado. Revisa tu bandeja de entrada.',
    };
  }

  // Perfil del usuario logueado. Incluye a qué negocios y sedes tiene acceso, que es
  // lo que el dashboard necesita para saber qué puede mostrarle. Nunca devuelve password.
  async getPerfil(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        emailVerificado: true,
        rolGlobal: true,
        plan: true,
        createdAt: true,
        negocios: {
          select: {
            negocio: { select: { id: true, nombre: true } },
          },
        },
        sedes: {
          select: {
            sede: { select: { id: true, nombre: true, negocioId: true } },
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  // Para que el dueño encuentre a quién vincular a una sede. Exige el correo exacto y
  // devuelve solo id y nombre: así sirve para invitar, pero no para averiguar quién
  // está registrado en la plataforma ni para leer datos de nadie.
  async buscarPorEmail(email?: string) {
    if (!email) {
      throw new BadRequestException(
        'Debes indicar el email que quieres buscar',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true, nombre: true },
    });

    if (!usuario) {
      throw new NotFoundException(
        'No hay ninguna cuenta registrada con ese correo',
      );
    }
    return usuario;
  }

  async updateUsuario(usuarioId: string, dto: UpdateUsuarioDto) {
    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { nombre: dto.nombre, telefono: dto.telefono },
      select: { id: true, nombre: true, email: true, telefono: true },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (!usuario) {
      throw new NotFoundException(
        'No existe una cuenta registrada con ese correo',
      );
    }

    const resetToken = this.jwtService.sign(
      { sub: usuario.id, type: 'password-reset' },
      { expiresIn: '1h' }, // más corto que el de verificación, por ser una acción sensible
    );

    // Sin esperar, por lo mismo que en register.
    void this.mailService.sendPasswordResetEmail(
      usuario.email,
      usuario.nombre,
      resetToken,
    );
    return {
      mensaje:
        'Se envió un enlace para restablecer tu contraseña. Revisa tu correo.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(dto.token);
    } catch {
      throw new UnauthorizedException('El enlace es inválido o expiró');
    }

    if (payload.type !== 'password-reset') {
      throw new UnauthorizedException('Token inválido para esta operación');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashedPassword },
    });

    return { mensaje: 'Contraseña actualizada correctamente' };
  }
  async cambiarEmail(usuarioId: string, dto: CambiarEmailDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const emailExistente = await this.prisma.usuario.findUnique({
      where: { email: dto.nuevoEmail },
    });
    if (emailExistente) {
      throw new ConflictException('Ese correo ya está en uso por otra cuenta');
    }

    const changeToken = this.jwtService.sign(
      { sub: usuario.id, nuevoEmail: dto.nuevoEmail, type: 'email-change' },
      { expiresIn: '1h' },
    );

    // Sin esperar, por lo mismo que en register.
    void this.mailService.sendEmailChangeConfirmation(
      dto.nuevoEmail,
      usuario.nombre,
      changeToken,
    );
    return {
      mensaje: 'Enviamos un correo de confirmación a tu nueva dirección',
    };
  }

  async confirmarCambioEmail(dto: ConfirmarCambioEmailDto) {
    let payload: { sub: string; nuevoEmail: string; type: string };
    try {
      payload = this.jwtService.verify(dto.token);
    } catch {
      throw new UnauthorizedException('El enlace es inválido o expiró');
    }

    if (payload.type !== 'email-change') {
      throw new UnauthorizedException('Token inválido para esta operación');
    }

    const emailExistente = await this.prisma.usuario.findUnique({
      where: { email: payload.nuevoEmail },
    });
    if (emailExistente) {
      throw new ConflictException(
        'Ese correo ya fue tomado por otra cuenta mientras tanto',
      );
    }

    await this.prisma.usuario.update({
      where: { id: payload.sub },
      data: { email: payload.nuevoEmail },
    });

    return { mensaje: 'Correo actualizado correctamente' };
  }
}
