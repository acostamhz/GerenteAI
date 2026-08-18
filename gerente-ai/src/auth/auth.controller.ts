import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AsociarNegocioDto } from './dto/asociar-negocio.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ReenviarVerificacionDto } from './dto/reenviar-verificacion.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ConfirmarCambioEmailDto } from './dto/confirmar-cambio-email.dto';
import { CambiarEmailDto } from './dto/cambiar-email.dto';

type AuthUser = { userId: string; rolGlobal: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('verificar-email')
  verificarEmail(@Query('token') token: string) {
    return this.authService.verificarEmail(token);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('asociar-negocio')
  @UseGuards(JwtAuthGuard)
  asociarNegocio(
    @CurrentUser() user: AuthUser,
    @Body() dto: AsociarNegocioDto,
  ) {
    return this.authService.asociarNegocio(user.userId, user.rolGlobal, dto);
  }

  @Get('usuarios/me')
  @UseGuards(JwtAuthGuard)
  getPerfil(@CurrentUser() user: AuthUser) {
    return this.authService.getPerfil(user.userId);
  }

  // Búsqueda por correo exacto, para vincular a alguien a un negocio o a una sede.
  @Get('usuarios')
  @UseGuards(JwtAuthGuard)
  buscarPorEmail(@Query('email') email?: string) {
    return this.authService.buscarPorEmail(email);
  }

  @Delete('usuarios/:id')
  @UseGuards(JwtAuthGuard)
  removeUsuario(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.authService.removeUsuario(id, user.rolGlobal);
  }

  @Post('reenviar-verificacion')
  reenviarVerificacion(@Body() dto: ReenviarVerificacionDto) {
    return this.authService.reenviarVerificacion(dto);
  }
  @Patch('usuarios/me')
  @UseGuards(JwtAuthGuard)
  updateUsuario(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.authService.updateUsuario(user.userId, dto);
  }
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
  @Post('cambiar-email')
  @UseGuards(JwtAuthGuard)
  cambiarEmail(
    @CurrentUser() user: { userId: string },
    @Body() dto: CambiarEmailDto,
  ) {
    return this.authService.cambiarEmail(user.userId, dto);
  }

  @Post('confirmar-cambio-email')
  confirmarCambioEmail(@Body() dto: ConfirmarCambioEmailDto) {
    return this.authService.confirmarCambioEmail(dto);
  }
}
