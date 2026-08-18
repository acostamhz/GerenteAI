import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma.module';
import { NegociosModule } from './modules/negocios.module';
import { SedesModule } from './modules/sedes.module';
import { ProductosModule } from './modules/productos.module';
import { ClientesModule } from './modules/clientes.module';
import { ProveedoresModule } from './modules/proveedores.module';
import { GastosModule } from './modules/gastos.module';
import { UsuarioSedesModule } from './modules/usuario-sedes.module';
import { VentasModule } from './modules/ventas.module';
import { ComprasModule } from './modules/compras.module';
import { AbonosModule } from './modules/abonos.module';
import { ReportesModule } from './modules/reportes.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    NegociosModule,
    SedesModule,
    ProductosModule,
    ClientesModule,
    ProveedoresModule,
    GastosModule,
    UsuarioSedesModule,
    VentasModule,
    ComprasModule,
    AbonosModule,
    ReportesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
