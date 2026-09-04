// Los decoradores de class-validator lo necesitan; en la app lo carga Nest.
import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { InterpretMessageDto } from './interpret-message.dto';

/**
 * Lo que n8n manda tiene que pasar la validacion.
 *
 * El backend corre con `forbidNonWhitelisted`, asi que un campo mal validado no
 * degrada: tumba la peticion entera con un 400, n8n se va por la rama de
 * emergencia y el usuario recibe "no pude procesar tu mensaje". Paso con las
 * notas de voz: Meta las manda como "audio/ogg; codecs=opus" y la validacion
 * exigia un MIME sin parametros, asi que NINGUNA nota de voz funcionaba.
 */

function validar(payload: Record<string, unknown>) {
  const dto = plainToInstance(InterpretMessageDto, payload);
  return validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
}

const BASE = {
  message: 'Hola',
  phone: '573001234567',
  messageId: 'wamid.abc',
};

describe('InterpretMessageDto · archivos', () => {
  it('acepta el MIME que Meta manda en una nota de voz', () => {
    const errores = validar({
      ...BASE,
      media: {
        kind: 'audio',
        mimeType: 'audio/ogg; codecs=opus',
        dataBase64: 'T2dnUwACAAAAAAAAAAA=',
      },
    });

    expect(errores).toHaveLength(0);
  });

  it('acepta una foto', () => {
    const errores = validar({
      ...BASE,
      media: {
        kind: 'image',
        mimeType: 'image/jpeg',
        dataBase64: 'T2dnUwACAAAAAAAAAAA=',
      },
    });

    expect(errores).toHaveLength(0);
  });

  it('rechaza un tipo que no es ni audio ni imagen', () => {
    // Un PDF o un video no se saben interpretar, y aceptarlos solo haria que
    // el modelo devolviera cualquier cosa.
    const errores = validar({
      ...BASE,
      media: {
        kind: 'audio',
        mimeType: 'application/pdf',
        dataBase64: 'T2dnUwACAAAAAAAAAAA=',
      },
    });

    expect(errores).not.toHaveLength(0);
  });

  it('rechaza lo que no es base64', () => {
    const errores = validar({
      ...BASE,
      media: {
        kind: 'audio',
        mimeType: 'audio/ogg',
        dataBase64: 'esto no es base64 !!!',
      },
    });

    expect(errores).not.toHaveLength(0);
  });

  it('un mensaje de texto normal sigue pasando sin archivo', () => {
    expect(validar(BASE)).toHaveLength(0);
  });

  it('acepta el id del mensaje citado', () => {
    const errores = validar({
      ...BASE,
      quotedMessageId: 'wamid.HBgMNTczMDE0MTMyMjg0FQIAERgS',
    });

    expect(errores).toHaveLength(0);
  });
});
