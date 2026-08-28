import { Module } from '@nestjs/common';
import { ReportesController } from '../controllers/reportes.controller';
import { ReportesService } from '../services/reportes.service';
import { NegociosModule } from './negocios.module';
import { PlanesModule } from './planes.module';

@Module({
  imports: [NegociosModule, PlanesModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
