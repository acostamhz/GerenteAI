import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_SECRET no está definido en las variables de entorno',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Passport ya validó la firma y la expiración. Lo que falta comprobar es para
   * QUÉ se emitió el token.
   *
   * Los de verificación de correo, reset de contraseña y cambio de correo se
   * firman con el mismo secreto, así que sin esta comprobación cualquiera de
   * ellos abriría sesión. El de verificación es el más grave: viaja dentro de un
   * correo, y basta con leerlo para entrar a la cuenta sin saber la contraseña.
   */
  validate(payload: JwtPayload) {
    if (payload.type !== 'session') {
      throw new UnauthorizedException(
        'Este token no sirve para iniciar sesión',
      );
    }

    return {
      userId: payload.sub,
      negocioId: payload.negocioId,
      role: payload.role,
      rolGlobal: payload.rolGlobal,
    };
  }
}
