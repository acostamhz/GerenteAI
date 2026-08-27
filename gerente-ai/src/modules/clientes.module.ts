import { Module } from '@nestjs/common';
import { ClientesController } from '../controllers/clientes.controller';
import { ClientesService } from '../services/clientes.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}