import express from 'express';
import multer from 'multer';

import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

import {
  getDossierDocuments,
  uploadDossierDocuments,
  downloadDocument,
  deleteDocument,
} from '../controllers/document.controller.ts';
import { prisma } from '../lib/prisma.ts';

const router = express.Router();

const UPLOAD_DIR = path.resolve('uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,

    filename: (req, file, cb) => {
      cb(
        null,
        crypto.randomUUID() + path.extname(file.originalname).toLowerCase(),
      );
    },
  }),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ALLOWED[ext]?.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non autorisé (PDF, DOC, DOCX uniquement).'));
    }
  },
});

// List documents
router.get('/dossiers/:id/documents', getDossierDocuments);

// Upload documents
router.post(
  '/dossiers/:id/documents',

  (req, res, next) => {
    upload.array('files', 10)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error:
            err.code === 'LIMIT_FILE_SIZE'
              ? 'Fichier trop volumineux (max 10 Mo).'
              : err.code === 'LIMIT_FILE_COUNT'
                ? 'Maximum 10 fichiers autorisés.'
                : err.message,
        });
      }

      next();
    });
  },

  uploadDossierDocuments,
);

// Download document
router.get('/documents/:id/download', downloadDocument);
// Inline preview (PDF in iframe, DOCX fetched as blob)
router.get('/documents/:id/preview', async (req, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Fichier introuvable.' });

  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
  );
  res.sendFile(path.join(UPLOAD_DIR, doc.storedName));
});
// Delete document
router.delete('/documents/:id', deleteDocument);




export default router;
