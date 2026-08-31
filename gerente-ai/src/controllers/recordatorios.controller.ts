import {
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RecordatoriosService } from '../services/recordatorios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

@Controller('recordatorios')
export class RecordatoriosController {
  constructor(private readonly recordatorios: RecordatoriosService) {}

  /**
   * Dispara la tanda de avisos y devuelve cuántos salió cada uno.
   *
   * Existe porque el cron interno no es fiable en Render: el servicio se duerme
   * sin tráfico y un proceso dormido no ejecuta nada. Este endpoint lo llama un
   * cron externo, y de paso permite ensayar sin esperar a la hora señalada.
   *
   * Solo MASTER: mandar correos a los clientes no es una operación de un usuario
   * cualquiera, y sin restricción cualquiera podría dispararla en bucle.
   */
  @Post('ejecutar')
  @UseGuards(JwtAuthGuard)
  async ejecutar(@CurrentUser() user: AuthUser) {
    if (user.rolGlobal !== 'MASTER') {
      throw new ForbiddenException(
        'Solo la plataforma puede disparar los recordatorios',
      );
    }
    return this.recordatorios.ejecutar();
  }
}
