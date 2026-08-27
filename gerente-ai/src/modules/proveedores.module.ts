import { Module } from '@nestjs/common';
import { ProveedoresController } from '../controllers/proveedores.controller';
import { ProveedoresService } from '../services/proveedores.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
})
export class ProveedoresModule {}