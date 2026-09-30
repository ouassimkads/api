import { Router } from 'express';

import {
  getDossiers,
  createDossier,
  updateDossier,
  deleteDossier,
  getArchive,
  restoreDossier,
} from '../controllers/dossier.controller.ts';

const router = Router();

router.get('/archive', getArchive);

router.get('/', getDossiers);

router.post('/', createDossier);

router.put('/:id', updateDossier);

router.delete('/:id', deleteDossier);

router.post('/:id/restore', restoreDossier);

export default router;
