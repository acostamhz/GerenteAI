import { Module } from '@nestjs/common';
import { ComprasController } from '../controllers/compras.controller';
import { ComprasService } from '../services/compras.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [ComprasController],
  providers: [ComprasService],
})
export class ComprasModule {}
