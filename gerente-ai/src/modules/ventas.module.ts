import { Module } from '@nestjs/common';
import { VentasController } from '../controllers/ventas.controller';
import { VentasService } from '../services/ventas.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
