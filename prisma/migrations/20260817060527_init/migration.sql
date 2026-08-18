-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('DAMNIFICADO', 'DONANTE', 'MODERADOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CategoriaNecesidad" AS ENUM ('AGUA', 'ALIMENTOS', 'SALUD', 'REFUGIO', 'ROPA', 'HIGIENE', 'RESCATE', 'OTRO');

-- CreateEnum
CREATE TYPE "Urgencia" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoNecesidad" AS ENUM ('PENDIENTE', 'VERIFICADA', 'EN_PROCESO', 'RESUELTA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "departamentos" (
    "codigo" VARCHAR(2) NOT NULL,
    "nombre" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "municipios" (
    "codigo" VARCHAR(5) NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tipo_municipio" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "departamento_codigo" VARCHAR(2) NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nombre" TEXT,
    "telefono" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'DAMNIFICADO',
    "municipio_codigo" VARCHAR(5),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "necesidades" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" "CategoriaNecesidad" NOT NULL,
    "urgencia" "Urgencia" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoNecesidad" NOT NULL DEFAULT 'PENDIENTE',
    "num_personas" INTEGER NOT NULL DEFAULT 1,
    "contacto_nombre" TEXT,
    "contacto_telefono" TEXT,
    "contacto_email" TEXT,
    "municipio_codigo" VARCHAR(5) NOT NULL,
    "autor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "necesidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "municipios_departamento_codigo_idx" ON "municipios"("departamento_codigo");

-- CreateIndex
CREATE INDEX "municipios_slug_idx" ON "municipios"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_municipio_codigo_idx" ON "usuarios"("municipio_codigo");

-- CreateIndex
CREATE INDEX "necesidades_municipio_codigo_idx" ON "necesidades"("municipio_codigo");

-- CreateIndex
CREATE INDEX "necesidades_categoria_idx" ON "necesidades"("categoria");

-- CreateIndex
CREATE INDEX "necesidades_estado_idx" ON "necesidades"("estado");

-- CreateIndex
CREATE INDEX "necesidades_urgencia_idx" ON "necesidades"("urgencia");

-- AddForeignKey
ALTER TABLE "municipios" ADD CONSTRAINT "municipios_departamento_codigo_fkey" FOREIGN KEY ("departamento_codigo") REFERENCES "departamentos"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_municipio_codigo_fkey" FOREIGN KEY ("municipio_codigo") REFERENCES "municipios"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "necesidades" ADD CONSTRAINT "necesidades_municipio_codigo_fkey" FOREIGN KEY ("municipio_codigo") REFERENCES "municipios"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "necesidades" ADD CONSTRAINT "necesidades_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
