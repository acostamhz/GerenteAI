import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('El token ha expirado, por favor inicia sesión nuevamente');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('El token es inválido');
      }
      throw new UnauthorizedException('No se proporcionó un token válido');
    }
    return user;
  }
}