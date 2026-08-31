import { Module } from '@nestjs/common';
import { PagosController } from '../controllers/pagos.controller';
import { PagosService } from '../services/pagos.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
