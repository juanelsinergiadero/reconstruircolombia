/*
  Warnings:

  - The values [AGUA,REFUGIO,ROPA] on the enum `CategoriaNecesidad` will be removed. If these variants are still used in the database, this will fail.
  - The values [VERIFICADA] on the enum `EstadoNecesidad` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `autor_id` on table `necesidades` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TipoOrganizacion" AS ENUM ('INSTITUCION_EDUCATIVA', 'JAC', 'FUNDACION', 'COLECTIVO', 'ENTIDAD_OFICIAL', 'OTRA');

-- CreateEnum
CREATE TYPE "EstadoOrganizacion" AS ENUM ('REGISTRADA', 'VERIFICADA');

-- CreateEnum
CREATE TYPE "TipoReporte" AS ENUM ('PROPIA', 'EN_NOMBRE_DE');

-- CreateEnum
CREATE TYPE "TipoValidacion" AS ENUM ('COMUNITARIA', 'INSTITUCIONAL');

-- AlterEnum
BEGIN;
CREATE TYPE "CategoriaNecesidad_new" AS ENUM ('AGUA_SANEAMIENTO', 'ALIMENTOS', 'ALOJAMIENTO', 'SALUD', 'HIGIENE', 'ROPA_ABRIGO', 'PROTECCION', 'EDUCACION', 'RESCATE', 'OTRO');
ALTER TABLE "necesidades" ALTER COLUMN "categoria" TYPE "CategoriaNecesidad_new" USING ("categoria"::text::"CategoriaNecesidad_new");
ALTER TYPE "CategoriaNecesidad" RENAME TO "CategoriaNecesidad_old";
ALTER TYPE "CategoriaNecesidad_new" RENAME TO "CategoriaNecesidad";
DROP TYPE "public"."CategoriaNecesidad_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoNecesidad_new" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'RECHAZADA');
ALTER TABLE "public"."necesidades" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "necesidades" ALTER COLUMN "estado" TYPE "EstadoNecesidad_new" USING ("estado"::text::"EstadoNecesidad_new");
ALTER TYPE "EstadoNecesidad" RENAME TO "EstadoNecesidad_old";
ALTER TYPE "EstadoNecesidad_new" RENAME TO "EstadoNecesidad";
DROP TYPE "public"."EstadoNecesidad_old";
ALTER TABLE "necesidades" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
COMMIT;

-- DropForeignKey
ALTER TABLE "necesidades" DROP CONSTRAINT "necesidades_autor_id_fkey";

-- AlterTable
ALTER TABLE "necesidades" ADD COLUMN     "hay_adultos_mayores" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hay_enfermos_cronicos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hay_gestantes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hay_menores" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hay_personas_discapacidad" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organizacion_id" TEXT,
ADD COLUMN     "radicado_rud" TEXT,
ADD COLUMN     "tipo_reporte" "TipoReporte" NOT NULL DEFAULT 'PROPIA',
ALTER COLUMN "autor_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "organizacion_id" TEXT;

-- CreateTable
CREATE TABLE "organizaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoOrganizacion" NOT NULL,
    "estado" "EstadoOrganizacion" NOT NULL DEFAULT 'REGISTRADA',
    "descripcion" TEXT,
    "contacto_email" TEXT,
    "contacto_telefono" TEXT,
    "municipio_codigo" VARCHAR(5) NOT NULL,
    "documento_url" TEXT,
    "verificada_por" TEXT,
    "verificada_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validaciones" (
    "id" TEXT NOT NULL,
    "tipo" "TipoValidacion" NOT NULL DEFAULT 'COMUNITARIA',
    "nota" TEXT,
    "validador_id" TEXT NOT NULL,
    "necesidad_id" TEXT NOT NULL,
    "organizacion_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizaciones_municipio_codigo_idx" ON "organizaciones"("municipio_codigo");

-- CreateIndex
CREATE INDEX "organizaciones_estado_idx" ON "organizaciones"("estado");

-- CreateIndex
CREATE INDEX "validaciones_necesidad_id_idx" ON "validaciones"("necesidad_id");

-- CreateIndex
CREATE INDEX "validaciones_validador_id_idx" ON "validaciones"("validador_id");

-- CreateIndex
CREATE UNIQUE INDEX "validaciones_validador_id_necesidad_id_key" ON "validaciones"("validador_id", "necesidad_id");

-- CreateIndex
CREATE INDEX "necesidades_autor_id_idx" ON "necesidades"("autor_id");

-- CreateIndex
CREATE INDEX "necesidades_organizacion_id_idx" ON "necesidades"("organizacion_id");

-- CreateIndex
CREATE INDEX "usuarios_organizacion_id_idx" ON "usuarios"("organizacion_id");

-- AddForeignKey
ALTER TABLE "organizaciones" ADD CONSTRAINT "organizaciones_municipio_codigo_fkey" FOREIGN KEY ("municipio_codigo") REFERENCES "municipios"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "necesidades" ADD CONSTRAINT "necesidades_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "necesidades" ADD CONSTRAINT "necesidades_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_validador_id_fkey" FOREIGN KEY ("validador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_necesidad_id_fkey" FOREIGN KEY ("necesidad_id") REFERENCES "necesidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
