import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';

import { InterpretMessageDto } from './dto/interpret-message.dto';
import { N8nApiKeyGuard } from './guards/n8n-api-key.guard';
import {
  WhatsappInterpretService,
  type InterpretResponse,
} from './services/whatsapp-interpret.service';

/**
 * API que consume n8n. Es la unica puerta de entrada del canal de WhatsApp.
 *
 * No se monta en `FinanceAiController` a proposito: aquel sirve al frontend
 * (respuestas envueltas en `{success, data}`) y este sirve a un workflow, que
 * necesita un JSON plano y estable. Mezclarlos obligaria a n8n a cambiar cada
 * vez que cambie el panel.
 */
@Controller('ai')
@UseGuards(N8nApiKeyGuard)
export class WhatsappController {
  constructor(private readonly interpretService: WhatsappInterpretService) {}

  /**
   * Interpreta un mensaje de WhatsApp y devuelve el texto de respuesta.
   *
   * Responde 200 incluso cuando la IA falla (con `ok:false` y un `reply`
   * degradado): asi el usuario de WhatsApp siempre recibe algo. Los unicos
   * errores que llegan a n8n como fallo son los que si conviene reintentar
   * (400 por payload invalido, 401 por API key, 5xx por caida del backend).
   */
  @Post('interpret')
  @HttpCode(200)
  interpret(@Body() dto: InterpretMessageDto): Promise<InterpretResponse> {
    return this.interpretService.interpret(dto);
  }

  /** Comprobacion rapida desde n8n: ¿esta viva la integracion y la API key es correcta? */
  @Get('interpret/ping')
  ping() {
    return {
      ok: true,
      service: 'whatsapp-interpret',
      at: new Date().toISOString(),
    };
  }
}
