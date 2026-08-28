import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

// El constructor exige el secreto; estas pruebas no firman nada, solo ejercitan
// la validación del payload ya verificado por Passport.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'secreto-de-prueba';

const payload = (type: JwtPayload['type']): JwtPayload => ({
  sub: 'usuario-1',
  type,
  negocioId: 'negocio-1',
  role: 'ADMIN',
  rolGlobal: 'CLIENTE',
});

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy();

  it('acepta un token de sesión y expone los datos del usuario', () => {
    expect(strategy.validate(payload('session'))).toEqual({
      userId: 'usuario-1',
      negocioId: 'negocio-1',
      role: 'ADMIN',
      rolGlobal: 'CLIENTE',
    });
  });

  // El caso grave: ese token viaja dentro de un correo. Si sirviera como
  // credencial, bastaría con leer el buzón para entrar sin saber la contraseña.
  it('rechaza el token de verificación de correo', () => {
    expect(() => strategy.validate(payload('email-verification'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza el token de recuperación de contraseña', () => {
    expect(() => strategy.validate(payload('password-reset'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza el token de cambio de correo', () => {
    expect(() => strategy.validate(payload('email-change'))).toThrow(
      UnauthorizedException,
    );
  });

  // Los tokens emitidos antes de este cambio no llevan `type`. Que dejen de
  // servir es intencional: obliga a volver a iniciar sesión una vez.
  it('rechaza un token antiguo sin type', () => {
    const antiguo = { ...payload('session') } as Partial<JwtPayload>;
    delete antiguo.type;

    expect(() => strategy.validate(antiguo as JwtPayload)).toThrow(
      UnauthorizedException,
    );
  });
});
