import { Module } from '@nestjs/common';
import { SedesController } from '../controllers/sedes.controller';
import { SedesService } from '../services/sedes.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [SedesController],
  providers: [SedesService],
})
export class SedesModule {}
