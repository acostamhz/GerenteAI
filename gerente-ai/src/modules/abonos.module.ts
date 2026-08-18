import { Module } from '@nestjs/common';
import { AbonosController } from '../controllers/abonos.controller';
import { AbonosService } from '../services/abonos.service';
import { NegociosModule } from './negocios.module';

@Module({
  imports: [NegociosModule],
  controllers: [AbonosController],
  providers: [AbonosService],
})
export class AbonosModule {}
