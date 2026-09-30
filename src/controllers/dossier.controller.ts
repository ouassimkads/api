import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.ts';

import { prisma } from '../lib/prisma.ts';

import {
  ApiError,
  buildArchiveWhere,
  buildDossierWhere,
  generateNextDossierNumber,
  validateCreateDossier,
} from '../lib/dossiers.ts';

export async function getDossiers(req: Request, res: Response) {
  try {
    const page = Math.max(0, Number(req.query.page ?? '0') || 0);

    const pageSize = Math.min(
      50,
      Math.max(1, Number(req.query.pageSize ?? '8') || 8),
    );

    const where = buildDossierWhere({
      search:
        typeof req.query.search === 'string' ? req.query.search : undefined,

      type: typeof req.query.type === 'string' ? req.query.type : undefined,

      agence:
        typeof req.query.agence === 'string' ? req.query.agence : undefined,

      statut:
        typeof req.query.statut === 'string' ? req.query.statut : undefined,
    });

    const [rows, total] = await Promise.all([
      prisma.dossier.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: page * pageSize,
        take: pageSize,
        include: { _count: { select: { documents: true } } },
      }),

      prisma.dossier.count({
        where,
      }),
    ]);

    const nextPage = (page + 1) * pageSize < total ? page + 1 : null;

    return res.json({
      rows,
      nextPage,
      total,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error('[GET /api/dossiers]', err);

    return res.status(500).json({
      error: 'Erreur lors du chargement des dossiers.',
    });
  }
}

export async function createDossier(req: Request, res: Response) {
  try {
    const input = validateCreateDossier(req.body);

    const numeroDossier = await generateNextDossierNumber();

    const dossier = await prisma.dossier.create({
      data: {
        numeroDossier,
        numeroSinistre: input.numeroSinistre,
        type: input.type,
        agence: input.agence,
        client: input.client,
        dateSinistre: new Date(input.dateSinistre),
        statut: input.statut ?? 'OUVERT',
        partieAdverse: input.partieAdverse,
        agenceAdverse: input.agenceAdverse,
      },
    });

    return res.status(201).json(dossier);
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.message });
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return res.status(409).json({
        error: 'Un dossier avec ce numéro de sinistre existe déjà.',
      });
    }

    console.error('[POST /api/dossiers]', err);

    return res.status(500).json({
      error: 'Erreur lors de la création du dossier.',
    });
  }
}

// export async function updateDossier(req: Request, res: Response) {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         error: 'Identifiant du dossier manquant.',
//       });
//     }

//     const body = req.body;

//     const dossier = await prisma.dossier.update({
//       where: {
//         id,
//       },

//       data: {
//         numeroSinistre: body.numeroSinistre,
//         type: body.type,
//         agence: body.agence,
//         client: body.client,
//         dateSinistre: new Date(body.dateSinistre),
//         statut: body.statut,
//       },
//     });

//     return res.json(dossier);
//   } catch (err) {
//     if (err instanceof Prisma.PrismaClientKnownRequestError) {
//       if (err.code === 'P2025') {
//         return res.status(404).json({
//           error: 'Dossier introuvable.',
//         });
//       }

//       if (err.code === 'P2002') {
//         return res.status(409).json({
//           error: 'Ce numéro de sinistre existe déjà.',
//         });
//       }
//     }

//     console.error('[PUT /api/dossiers/:id]', err);

//     return res.status(500).json({
//       error: 'Erreur lors de la modification du dossier.',
//     });
//   }
// }

export async function updateDossier(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({
        error: 'Identifiant du dossier invalide.',
      });
    }

    const body = req.body;

    const dossier = await prisma.dossier.update({
      where: {
        id,
      },
      data: {
        numeroSinistre: body.numeroSinistre,
        type: body.type,
        agence: body.agence,
        client: body.client,
        dateSinistre: new Date(body.dateSinistre),
        statut: body.statut,
      },
    });

    return res.json(dossier);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({
          error: 'Dossier introuvable.',
        });
      }

      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Ce numéro de sinistre existe déjà.',
        });
      }
    }

    console.error('[PUT /api/dossiers/:id]', err);

    return res.status(500).json({
      error: 'Erreur lors de la modification du dossier.',
    });
  }
}

// export async function deleteDossier(req: Request, res: Response) {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         error: 'Identifiant du dossier manquant.',
//       });
//     }

//     const dossier = await prisma.dossier.delete({
//       where: {
//         id,
//       },
//     });

//     return res.json({
//       message: 'Dossier supprimé avec succès.',
//       dossier,
//     });
//   } catch (err) {
//     if (
//       err instanceof Prisma.PrismaClientKnownRequestError &&
//       err.code === 'P2025'
//     ) {
//       return res.status(404).json({
//         error: 'Dossier introuvable.',
//       });
//     }

//     console.error('[DELETE /api/dossiers/:id]', err);

//     return res.status(500).json({
//       error: 'Erreur lors de la suppression du dossier.',
//     });
//   }
// }

export async function deleteDossier(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({
        error: 'Identifiant du dossier invalide.',
      });
    }

    const dossier = await prisma.dossier.delete({
      where: {
        id,
      },
    });

    return res.json({
      message: 'Dossier supprimé avec succès.',
      dossier,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return res.status(404).json({
        error: 'Dossier introuvable.',
      });
    }

    console.error('[DELETE /api/dossiers/:id]', err);

    return res.status(500).json({
      error: 'Erreur lors de la suppression du dossier.',
    });
  }
}
export async function getArchive(req: Request, res: Response) {
  try {
    const search =
      typeof req.query.search === 'string' ? req.query.search : undefined;

    const rows = await prisma.dossier.findMany({
      where: buildArchiveWhere(search),
      orderBy: {
        dateCloture: 'desc',
      },
      take: 200,
      include: { _count: { select: { documents: true } } },
    });

    return res.json({
      rows,
      total: rows.length,
    });
  } catch (err) {
    console.error('[GET /api/dossiers/archive]', err);

    return res.status(500).json({
      error: "Erreur lors du chargement de l'archive.",
    });
  }
}

// export async function restoreDossier(req: Request, res: Response) {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         error: 'Identifiant du dossier manquant.',
//       });
//     }

//     const dossier = await prisma.dossier.update({
//       where: { id },
//       data: {
//         statut: 'OUVERT',
//         dateCloture: null,
//       },
//     });

//     return res.json(dossier);
//   } catch (err) {
//     if (
//       err instanceof Prisma.PrismaClientKnownRequestError &&
//       err.code === 'P2025'
//     ) {
//       return res.status(404).json({
//         error: 'Dossier introuvable.',
//       });
//     }

//     console.error('[POST /api/dossiers/:id/restore]', err);

//     return res.status(500).json({
//       error: 'Erreur lors de la restauration du dossier.',
//     });
//   }
// }

export async function restoreDossier(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({
        error: 'Identifiant du dossier invalide.',
      });
    }

    const dossier = await prisma.dossier.update({
      where: {
        id,
      },
      data: {
        statut: 'OUVERT',
        dateCloture: null,
      },
    });

    return res.json(dossier);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return res.status(404).json({
        error: 'Dossier introuvable.',
      });
    }

    console.error('[POST /api/dossiers/:id/restore]', err);

    return res.status(500).json({
      error: 'Erreur lors de la restauration du dossier.',
    });
  }
}