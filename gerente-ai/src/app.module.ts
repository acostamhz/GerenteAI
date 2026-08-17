import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinanceAiModule } from './modules/finance-ai/finance-ai.module';

@Module({
  imports: [
    // Carga .env antes de que AiModule resuelva el proveedor.
    ConfigModule.forRoot({ isGlobal: true }),
    AiModule,
    FinanceAiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
