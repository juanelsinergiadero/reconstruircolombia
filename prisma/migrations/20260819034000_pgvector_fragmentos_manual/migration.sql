-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "fragmentos_manual" (
    "id" TEXT NOT NULL,
    "manual" TEXT NOT NULL,
    "titulo_manual" TEXT NOT NULL,
    "seccion" TEXT,
    "pagina" INTEGER,
    "texto" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fragmentos_manual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fragmentos_manual_manual_idx" ON "fragmentos_manual"("manual");
