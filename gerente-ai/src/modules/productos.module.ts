import { Module } from '@nestjs/common';
import { ProductosController } from '../controllers/productos.controller';
import { ProductosService } from '../services/productos.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}
