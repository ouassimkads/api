import path from 'node:path';
import fs from 'node:fs';
import type { Request, Response } from 'express';
import type { Multer } from 'multer';

import { prisma } from '../lib/prisma.ts';

const UPLOAD_DIR = path.resolve('uploads');

const removeFiles = async (names: string[]) =>
  Promise.all(
    names.map((name: string) =>
      fs.promises.unlink(path.join(UPLOAD_DIR, name)).catch(() => {}),
    ),
  );

// GET /dossiers/:id/documents
export const getDossierDocuments = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (typeof id !== 'string') {
    return res.status(400).json({
      error: 'Identifiant du dossier invalide.',
    });
  }

  const docs = await prisma.document.findMany({
    where: {
      dossierId: id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.json(docs);
};

// POST /dossiers/:id/documents
export const uploadDossierDocuments = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (typeof id !== 'string') {
    return res.status(400).json({
      error: 'Identifiant du dossier invalide.',
    });
  }

  const files = (req.files ?? []) as Express.Multer.File[];

  const dossier = await prisma.dossier.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  if (!dossier) {
    await removeFiles(files.map((file) => file.filename));

    return res.status(404).json({
      error: 'Dossier introuvable.',
    });
  }

  if (files.length === 0) {
    return res.status(400).json({
      error: 'Aucun fichier reçu.',
    });
  }

  await prisma.document.createMany({
    data: files.map((file) => ({
      dossierId: dossier.id,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    })),
  });

  return res.status(201).json({
    count: files.length,
  });
};

// GET /documents/:id/download
export const downloadDocument = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (typeof id !== 'string') {
    return res.status(400).json({
      error: 'Identifiant du document invalide.',
    });
  }

  const doc = await prisma.document.findUnique({
    where: {
      id,
    },
  });

  if (!doc) {
    return res.status(404).json({
      error: 'Fichier introuvable.',
    });
  }

  const filePath = path.join(UPLOAD_DIR, doc.storedName);

  res.download(filePath, doc.originalName, (err) => {
    if (err && !res.headersSent) {
      return res.status(404).json({
        error: 'Fichier introuvable sur le serveur.',
      });
    }
  });
};

// DELETE /documents/:id
export const deleteDocument = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (typeof id !== 'string') {
    return res.status(400).json({
      error: 'Identifiant du document invalide.',
    });
  }

  const doc = await prisma.document.findUnique({
    where: {
      id,
    },
  });

  if (!doc) {
    return res.status(404).json({
      error: 'Fichier introuvable.',
    });
  }

  await prisma.document.delete({
    where: {
      id: doc.id,
    },
  });

  await removeFiles([doc.storedName]);

  return res.json({
    ok: true,
  });
};
