-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "solicitudes_contacto" (
    "id" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "mensaje" TEXT,
    "solicitante_id" TEXT NOT NULL,
    "necesidad_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondida_en" TIMESTAMP(3),

    CONSTRAINT "solicitudes_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitudes_contacto_necesidad_id_idx" ON "solicitudes_contacto"("necesidad_id");

-- CreateIndex
CREATE INDEX "solicitudes_contacto_solicitante_id_idx" ON "solicitudes_contacto"("solicitante_id");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_contacto_solicitante_id_necesidad_id_key" ON "solicitudes_contacto"("solicitante_id", "necesidad_id");

-- AddForeignKey
ALTER TABLE "solicitudes_contacto" ADD CONSTRAINT "solicitudes_contacto_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_contacto" ADD CONSTRAINT "solicitudes_contacto_necesidad_id_fkey" FOREIGN KEY ("necesidad_id") REFERENCES "necesidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
