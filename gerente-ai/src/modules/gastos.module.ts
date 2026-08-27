import { Module } from '@nestjs/common';
import { GastosController } from '../controllers/gastos.controller';
import { GastosService } from '../services/gastos.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [GastosController],
  providers: [GastosService],
})
export class GastosModule {}