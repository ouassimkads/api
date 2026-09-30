-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroDossier" TEXT NOT NULL,
    "numeroSinistre" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "agence" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "dateSinistre" DATETIME NOT NULL,
    "dateCloture" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'OUVERT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_numeroDossier_key" ON "dossiers"("numeroDossier");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_numeroSinistre_key" ON "dossiers"("numeroSinistre");

-- CreateIndex
CREATE INDEX "dossiers_statut_idx" ON "dossiers"("statut");

-- CreateIndex
CREATE INDEX "dossiers_type_idx" ON "dossiers"("type");
