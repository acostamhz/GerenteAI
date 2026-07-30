import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma.module';
import { NegociosModule } from './modules/negocios.module';

@Module({
  imports: [PrismaModule, NegociosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
