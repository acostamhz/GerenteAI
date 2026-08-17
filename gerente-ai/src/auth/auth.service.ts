import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../services/prisma.service';
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
      { sub: usuario.id, type: 'email-verification' },
      { expiresIn: '24h' },
    );
    await this.mailService.sendVerificationEmail(usuario.email, usuario.nombre, verificationToken);

    return this.buildAuthResponse(usuario.id, usuario.nombre, null, null, usuario.rolGlobal);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Ya existe una cuenta registrada con ese correo. Intenta iniciar sesión.');
    }
    throw error;
  }
}

  async verificarEmail(token: string) {
  let payload: { sub: string; type: string };
  try {
    payload = this.jwtService.verify(token);
  } catch {
    throw new UnauthorizedException('El enlace de verificación es inválido o expiró');
  }

  if (payload.type !== 'email-verification') {
    throw new UnauthorizedException('Token inválido para esta operación');
  }

  const usuario = await this.prisma.usuario.findUnique({ where: { id: payload.sub } });
  if (!usuario) {
    throw new NotFoundException('Usuario no encontrado');
  }

  if (usuario.emailVerificado) {
    return { mensaje: 'Este correo ya había sido verificado anteriormente', usuarioId: usuario.id };
  }

  await this.prisma.usuario.update({
    where: { id: usuario.id },
    data: { emailVerificado: true },
  });

  return { mensaje: 'Correo verificado correctamente', usuarioId: usuario.id };
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
    throw new UnauthorizedException('Contraseña incorrecta, intente nuevamente');
  }

  if (!usuario.emailVerificado) {
    throw new UnauthorizedException('Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.');
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

  async asociarNegocio(usuarioId: string, dto: AsociarNegocioDto) {
  const negocio = await this.prisma.negocio.findUnique({ where: { id: dto.negocioId } });
  if (!negocio) {
    throw new NotFoundException('El negocio no se encontró en el sistema o no está registrado');
  }

  try {
    return await this.prisma.usuarioNegocio.create({
      data: {
        usuarioId,
        negocioId: dto.negocioId,
        role: dto.role ?? 'ADMIN',
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('El usuario ya está asociado a ese negocio');
    }
    throw error;
  }
}

  async removeUsuario(id: string) {
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
  const payload = { sub: usuarioId, negocioId, role, rolGlobal };
  return {
    accessToken: this.jwtService.sign(payload),
    usuario: { id: usuarioId, nombre, negocioId, role, rolGlobal },
  };
}


  async reenviarVerificacion(dto: ReenviarVerificacionDto) {
  const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });

  if (!usuario) {
    throw new NotFoundException('No existe una cuenta registrada con ese correo');
  }

  // TODO: cuando exista `emailVerificado` en el schema, validar aquí:
  // if (usuario.emailVerificado) throw new ConflictException('Este correo ya fue verificado');

  const verificationToken = this.jwtService.sign(
    { sub: usuario.id, type: 'email-verification' },
    { expiresIn: '24h' },
  );

  await this.mailService.sendVerificationEmail(usuario.email, usuario.nombre, verificationToken);

  return { mensaje: 'Correo de verificación reenviado. Revisa tu bandeja de entrada.' };
}

async updateUsuario(usuarioId: string, dto: UpdateUsuarioDto) {
  return this.prisma.usuario.update({
    where: { id: usuarioId },
    data: { telefono: dto.telefono },
  });
}

async forgotPassword(dto: ForgotPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (!usuario) {
      throw new NotFoundException('No existe una cuenta registrada con ese correo');
    }

    const resetToken = this.jwtService.sign(
      { sub: usuario.id, type: 'password-reset' },
      { expiresIn: '1h' }, // más corto que el de verificación, por ser una acción sensible
    );

    await this.mailService.sendPasswordResetEmail(usuario.email, usuario.nombre, resetToken);
    return { mensaje: 'Se envió un enlace para restablecer tu contraseña. Revisa tu correo.' };
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

    const usuario = await this.prisma.usuario.findUnique({ where: { id: payload.sub } });
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
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const emailExistente = await this.prisma.usuario.findUnique({ where: { email: dto.nuevoEmail } });
    if (emailExistente) {
      throw new ConflictException('Ese correo ya está en uso por otra cuenta');
    }

    const changeToken = this.jwtService.sign(
      { sub: usuario.id, nuevoEmail: dto.nuevoEmail, type: 'email-change' },
      { expiresIn: '1h' },
    );

    await this.mailService.sendEmailChangeConfirmation(dto.nuevoEmail, usuario.nombre, changeToken);
    return { mensaje: 'Enviamos un correo de confirmación a tu nueva dirección' };
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

    const emailExistente = await this.prisma.usuario.findUnique({ where: { email: payload.nuevoEmail } });
    if (emailExistente) {
      throw new ConflictException('Ese correo ya fue tomado por otra cuenta mientras tanto');
    }

    await this.prisma.usuario.update({
      where: { id: payload.sub },
      data: { email: payload.nuevoEmail },
    });

    return { mensaje: 'Correo actualizado correctamente' };
  }
}

