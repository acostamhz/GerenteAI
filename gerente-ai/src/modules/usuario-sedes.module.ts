import { Module } from '@nestjs/common';
import { UsuarioSedesController } from '../controllers/usuario-sedes.controller';
import { UsuarioSedesService } from '../services/usuario-sedes.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [UsuarioSedesController],
  providers: [UsuarioSedesService],
})
export class UsuarioSedesModule {}
