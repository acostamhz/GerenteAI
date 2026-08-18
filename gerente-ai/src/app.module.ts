import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinanceAiModule } from './modules/finance-ai/finance-ai.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { PrismaModule } from './modules/prisma.module';
import { NegociosModule } from './modules/negocios.module';
import { SedesModule } from './modules/sedes.module';
import { ProductosModule } from './modules/productos.module';
import { ClientesModule } from './modules/clientes.module';
import { ProveedoresModule } from './modules/proveedores.module';
import { GastosModule } from './modules/gastos.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Carga .env antes de que AiModule resuelva el proveedor.
    ConfigModule.forRoot({ isGlobal: true }),

    // Inteligencia Artificial
    AiModule,
    FinanceAiModule,

    // Canal de WhatsApp: lo consume n8n (ver docs/INTEGRACIONES.md)
    WhatsappModule,

    // Backend / negocio
    PrismaModule,
    NegociosModule,
    SedesModule,
    ProductosModule,
    ClientesModule,
    ProveedoresModule,
    GastosModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}