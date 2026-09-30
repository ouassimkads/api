-- CreateEnum
CREATE TYPE "DossierType" AS ENUM ('MATERIEL', 'CORPOREL', 'MARITIME');

-- CreateEnum
CREATE TYPE "DossierStatut" AS ENUM ('OUVERT', 'EN_COURS', 'EN_ATTENTE', 'CLOTURE', 'REJETE');

-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "numeroDossier" TEXT NOT NULL,
    "numeroSinistre" TEXT NOT NULL,
    "type" "DossierType" NOT NULL,
    "agence" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "dateSinistre" TIMESTAMP(3) NOT NULL,
    "dateCloture" TIMESTAMP(3),
    "statut" "DossierStatut" NOT NULL DEFAULT 'OUVERT',
    "partieAdverse" TEXT,
    "agenceAdverse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_numeroDossier_key" ON "dossiers"("numeroDossier");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_numeroSinistre_key" ON "dossiers"("numeroSinistre");

-- CreateIndex
CREATE INDEX "dossiers_statut_idx" ON "dossiers"("statut");

-- CreateIndex
CREATE INDEX "dossiers_type_idx" ON "dossiers"("type");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storedName_key" ON "documents"("storedName");

-- CreateIndex
CREATE INDEX "documents_dossierId_idx" ON "documents"("dossierId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
