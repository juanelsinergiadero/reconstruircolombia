-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "email_verificado" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tokens_verificacion" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expira" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_verificacion_token_key" ON "tokens_verificacion"("token");

-- CreateIndex
CREATE INDEX "tokens_verificacion_user_id_idx" ON "tokens_verificacion"("user_id");

-- AddForeignKey
ALTER TABLE "tokens_verificacion" ADD CONSTRAINT "tokens_verificacion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
