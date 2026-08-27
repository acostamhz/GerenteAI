import { Module } from '@nestjs/common';
import { ReportesController } from '../controllers/reportes.controller';
import { ReportesService } from '../services/reportes.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
