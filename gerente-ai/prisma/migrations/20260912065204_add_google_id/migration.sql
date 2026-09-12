-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "RolGlobal" AS ENUM ('MASTER', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoVenta" AS ENUM ('CONTADO', 'FIADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO');

-- CreateEnum
CREATE TYPE "BeneficiarioReparto" AS ENUM ('DUENO', 'TRABAJADOR');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('ARRIENDO', 'SERVICIOS', 'NOMINA', 'TRANSPORTE', 'OTROS');

-- CreateEnum
CREATE TYPE "RolMensaje" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO', 'ERROR');

-- CreateEnum
CREATE TYPE "CicloPago" AS ENUM ('MENSUAL', 'ANUAL');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "googleId" TEXT,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "rolGlobal" "RolGlobal" NOT NULL DEFAULT 'CLIENTE',
    "plan" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Negocio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefonoContacto" TEXT,
    "telefonoSecundario" TEXT,
    "contexto" TEXT,
    "diaInicioPeriodo" INTEGER NOT NULL DEFAULT 1,
    "plan" INTEGER NOT NULL DEFAULT 1,
    "planVenceEl" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "whatsappUserId" TEXT,
    "whatsappUsername" TEXT,
    "direccion" TEXT,
    "contexto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "negocioId" TEXT NOT NULL,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioNegocio" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "usuarioId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,

    CONSTRAINT "UsuarioNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioSede" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "usuarioId" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,

    CONSTRAINT "UsuarioSede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL,
    "rol" "RolMensaje" NOT NULL,
    "contenido" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sedeId" TEXT NOT NULL,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "negocioId" TEXT NOT NULL,
    "sedeId" TEXT,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "precioCompra" DECIMAL(65,30) NOT NULL,
    "precioVenta" DECIMAL(65,30) NOT NULL,
    "sedeId" TEXT NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "saldoPendiente" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "sedeId" TEXT NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "correo" TEXT,
    "direccion" TEXT,
    "sedeId" TEXT NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "tipo" "TipoVenta" NOT NULL DEFAULT 'CONTADO',
    "total" DECIMAL(65,30) NOT NULL,
    "saldoPendiente" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fechaVencimiento" TIMESTAMP(3),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "metodoPago" "MetodoPago",
    "grupoId" TEXT,
    "clienteId" TEXT,
    "sedeId" TEXT NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordatorioFiado" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "saldo" DECIMAL(65,30) NOT NULL,
    "enviadoEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordatorioFiado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleVenta" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,

    CONSTRAINT "DetalleVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedorId" TEXT,
    "sedeId" TEXT NOT NULL,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleCompra" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costo" DECIMAL(65,30) NOT NULL,
    "compraId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,

    CONSTRAINT "DetalleCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" "MetodoPago",
    "grupoId" TEXT,
    "sedeId" TEXT NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepartoUtilidad" (
    "id" TEXT NOT NULL,
    "beneficiario" "BeneficiarioReparto" NOT NULL,
    "nombre" TEXT,
    "porcentaje" DECIMAL(65,30) NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "totalRepartido" DECIMAL(65,30) NOT NULL,
    "grupoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sedeId" TEXT NOT NULL,

    CONSTRAINT "RepartoUtilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abono" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "ventaId" TEXT,

    CONSTRAINT "Abono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "plan" INTEGER NOT NULL,
    "ciclo" "CicloPago" NOT NULL,
    "montoEnCentavos" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "wompiTransaccionId" TEXT,
    "datosWompi" JSONB,
    "procesadoEl" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "negocioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacionPlan" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "venceEl" TIMESTAMP(3) NOT NULL,
    "enviadoEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "negocioId" TEXT NOT NULL,

    CONSTRAINT "NotificacionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Sede_telefono_key" ON "Sede"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "Sede_whatsappUserId_key" ON "Sede"("whatsappUserId");

-- CreateIndex
CREATE INDEX "Sede_negocioId_createdAt_idx" ON "Sede"("negocioId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioNegocio_usuarioId_negocioId_key" ON "UsuarioNegocio"("usuarioId", "negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioSede_usuarioId_sedeId_key" ON "UsuarioSede"("usuarioId", "sedeId");

-- CreateIndex
CREATE INDEX "Producto_sedeId_idx" ON "Producto"("sedeId");

-- CreateIndex
CREATE INDEX "Venta_sedeId_fecha_idx" ON "Venta"("sedeId", "fecha");

-- CreateIndex
CREATE INDEX "Venta_clienteId_saldoPendiente_idx" ON "Venta"("clienteId", "saldoPendiente");

-- CreateIndex
CREATE INDEX "Venta_grupoId_idx" ON "Venta"("grupoId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordatorioFiado_ventaId_key" ON "RecordatorioFiado"("ventaId");

-- CreateIndex
CREATE INDEX "RecordatorioFiado_enviadoEl_idx" ON "RecordatorioFiado"("enviadoEl");

-- CreateIndex
CREATE INDEX "DetalleVenta_productoId_idx" ON "DetalleVenta"("productoId");

-- CreateIndex
CREATE INDEX "Compra_sedeId_fecha_idx" ON "Compra"("sedeId", "fecha");

-- CreateIndex
CREATE INDEX "DetalleCompra_productoId_idx" ON "DetalleCompra"("productoId");

-- CreateIndex
CREATE INDEX "Gasto_sedeId_fecha_idx" ON "Gasto"("sedeId", "fecha");

-- CreateIndex
CREATE INDEX "Gasto_grupoId_idx" ON "Gasto"("grupoId");

-- CreateIndex
CREATE INDEX "RepartoUtilidad_sedeId_fecha_idx" ON "RepartoUtilidad"("sedeId", "fecha");

-- CreateIndex
CREATE INDEX "RepartoUtilidad_grupoId_idx" ON "RepartoUtilidad"("grupoId");

-- CreateIndex
CREATE INDEX "Abono_sedeId_fecha_idx" ON "Abono"("sedeId", "fecha");

-- CreateIndex
CREATE INDEX "Abono_clienteId_idx" ON "Abono"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_referencia_key" ON "Pago"("referencia");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_wompiTransaccionId_key" ON "Pago"("wompiTransaccionId");

-- CreateIndex
CREATE INDEX "Pago_negocioId_createdAt_idx" ON "Pago"("negocioId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificacionPlan_negocioId_idx" ON "NotificacionPlan"("negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacionPlan_negocioId_tipo_venceEl_key" ON "NotificacionPlan"("negocioId", "tipo", "venceEl");

-- AddForeignKey
ALTER TABLE "Sede" ADD CONSTRAINT "Sede_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioNegocio" ADD CONSTRAINT "UsuarioNegocio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioNegocio" ADD CONSTRAINT "UsuarioNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioSede" ADD CONSTRAINT "UsuarioSede_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioSede" ADD CONSTRAINT "UsuarioSede_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioFiado" ADD CONSTRAINT "RecordatorioFiado_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCompra" ADD CONSTRAINT "DetalleCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCompra" ADD CONSTRAINT "DetalleCompra_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepartoUtilidad" ADD CONSTRAINT "RepartoUtilidad_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionPlan" ADD CONSTRAINT "NotificacionPlan_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
