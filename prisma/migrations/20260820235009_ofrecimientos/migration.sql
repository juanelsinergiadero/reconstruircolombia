-- CreateEnum
CREATE TYPE "TipoAyuda" AS ENUM ('MATERIAL', 'SERVICIO');

-- CreateEnum
CREATE TYPE "EstadoOfrecimiento" AS ENUM ('ACTIVO', 'PAUSADO', 'CERRADO');

-- AlterTable
ALTER TABLE "solicitudes_contacto" ADD COLUMN     "ofrecimiento_id" TEXT,
ALTER COLUMN "necesidad_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "validaciones" ADD COLUMN     "ofrecimiento_id" TEXT,
ALTER COLUMN "necesidad_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ofrecimientos" (
    "id" TEXT NOT NULL,
    "tipo_ayuda" "TipoAyuda" NOT NULL,
    "categoria" "CategoriaNecesidad" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "capacidad" TEXT,
    "estado" "EstadoOfrecimiento" NOT NULL DEFAULT 'ACTIVO',
    "contacto_nombre" TEXT,
    "contacto_telefono" TEXT,
    "contacto_email" TEXT,
    "municipio_codigo" VARCHAR(5) NOT NULL,
    "autor_id" TEXT NOT NULL,
    "organizacion_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ofrecimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ofrecimientos_municipio_codigo_idx" ON "ofrecimientos"("municipio_codigo");

-- CreateIndex
CREATE INDEX "ofrecimientos_categoria_idx" ON "ofrecimientos"("categoria");

-- CreateIndex
CREATE INDEX "ofrecimientos_tipo_ayuda_idx" ON "ofrecimientos"("tipo_ayuda");

-- CreateIndex
CREATE INDEX "ofrecimientos_estado_idx" ON "ofrecimientos"("estado");

-- CreateIndex
CREATE INDEX "ofrecimientos_autor_id_idx" ON "ofrecimientos"("autor_id");

-- CreateIndex
CREATE INDEX "ofrecimientos_organizacion_id_idx" ON "ofrecimientos"("organizacion_id");

-- CreateIndex
CREATE INDEX "solicitudes_contacto_ofrecimiento_id_idx" ON "solicitudes_contacto"("ofrecimiento_id");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_contacto_solicitante_id_ofrecimiento_id_key" ON "solicitudes_contacto"("solicitante_id", "ofrecimiento_id");

-- CreateIndex
CREATE INDEX "validaciones_ofrecimiento_id_idx" ON "validaciones"("ofrecimiento_id");

-- CreateIndex
CREATE UNIQUE INDEX "validaciones_validador_id_ofrecimiento_id_key" ON "validaciones"("validador_id", "ofrecimiento_id");

-- AddForeignKey
ALTER TABLE "ofrecimientos" ADD CONSTRAINT "ofrecimientos_municipio_codigo_fkey" FOREIGN KEY ("municipio_codigo") REFERENCES "municipios"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofrecimientos" ADD CONSTRAINT "ofrecimientos_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofrecimientos" ADD CONSTRAINT "ofrecimientos_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_ofrecimiento_id_fkey" FOREIGN KEY ("ofrecimiento_id") REFERENCES "ofrecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_contacto" ADD CONSTRAINT "solicitudes_contacto_ofrecimiento_id_fkey" FOREIGN KEY ("ofrecimiento_id") REFERENCES "ofrecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CHECK: bidireccional (Opcion A). Prisma no tiene atributo nativo para
-- constraints CHECK (no existe en el lenguaje del schema), asi que viven
-- solo aqui, a mano. Garantizan que cada solicitud/validacion apunte a
-- EXACTAMENTE UNA necesidad U ofrecimiento, nunca ambos ni ninguno.
-- num_nonnulls() es una funcion nativa de Postgres (9.5+).
ALTER TABLE "solicitudes_contacto" ADD CONSTRAINT "solicitudes_contacto_exactamente_un_objetivo"
  CHECK (num_nonnulls("necesidad_id", "ofrecimiento_id") = 1);

ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_exactamente_un_objetivo"
  CHECK (num_nonnulls("necesidad_id", "ofrecimiento_id") = 1);
