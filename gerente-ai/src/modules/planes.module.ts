import { Module } from '@nestjs/common';
import { PlanesController } from '../controllers/planes.controller';
import { PlanesService } from '../services/planes.service';

@Module({
  controllers: [PlanesController],
  providers: [PlanesService],
  // Lo van a necesitar Sedes (tope de sedes) y Reportes (funciones Premium).
  exports: [PlanesService],
})
export class PlanesModule {}
