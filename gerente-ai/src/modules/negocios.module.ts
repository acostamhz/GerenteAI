import { Module } from '@nestjs/common';
import { NegociosController } from '../controllers/negocios.controller';
import { NegociosService } from '../services/negocios.service';
import { PlanesModule } from './planes.module';

@Module({
  imports: [PlanesModule],
  controllers: [NegociosController],
  providers: [NegociosService],
  exports: [NegociosService],
})
export class NegociosModule {}
