import {
  Prisma,
  DossierStatut,
  DossierType,
} from '../../generated/prisma/client.ts';

import { prisma } from './prisma.ts';

export const DOSSIER_TYPES: DossierType[] = [
  'MATERIEL',
  'CORPOREL',
  'MARITIME',
];

export const DOSSIER_STATUTS: DossierStatut[] = [
  'OUVERT',
  'EN_COURS',
  'EN_ATTENTE',
  'CLOTURE',
  'REJETE',
];

const CLOSED_STATUTS: DossierStatut[] = ['CLOTURE', 'REJETE'];

export interface DossierFilters {
  search?: string;
  type?: string;
  agence?: string;
  statut?: string;
}

export function buildDossierWhere(
  filters: DossierFilters,
): Prisma.DossierWhereInput {
  const where: Prisma.DossierWhereInput = {};

  const search = filters.search?.trim();

 if (search) {
   where.OR = [
     {
       numeroDossier: {
         contains: search,
       },
     },
     {
       numeroSinistre: {
         contains: search,
       },
     },
     {
       client: {
         contains: search,
       },
     },
     {
       partieAdverse: {
         contains: search,
       },
     },
   ];
 }

  if (filters.type && filters.type !== 'Tous') {
    if (!DOSSIER_TYPES.includes(filters.type as DossierType)) {
      throw new ApiError(400, `Type invalide: ${filters.type}`);
    }

    where.type = filters.type as DossierType;
  }

  if (filters.agence && filters.agence !== 'Toutes') {
    where.agence = filters.agence;
  }

  if (filters.statut && filters.statut !== 'Tous') {
    if (!DOSSIER_STATUTS.includes(filters.statut as DossierStatut)) {
      throw new ApiError(400, `Statut invalide: ${filters.statut}`);
    }

    where.statut = filters.statut as DossierStatut;
  }

  return where;
}

// export function buildArchiveWhere(search?: string): Prisma.DossierWhereInput {
//   const where: Prisma.DossierWhereInput = {
//     statut: {
//       in: CLOSED_STATUTS,
//     },
//   };

//   const q = search?.trim();

//   if (q) {
//     where.OR = [
//       {
//         numeroDossier: {
//           contains: q,
//           mode: 'insensitive',
//         },
//       },
//       {
//         numeroSinistre: {
//           contains: q,
//           mode: 'insensitive',
//         },
//       },
//       {
//         client: {
//           contains: q,
//           mode: 'insensitive',
//         },
//       },
//       // ⬇️ add here
//       {
//         partieAdverse: {
//           contains: q,
//           mode: 'insensitive',
//         },
//       },
//     ];
//   }

//   return where;
// }
export function buildArchiveWhere(search?: string): Prisma.DossierWhereInput {
  const where: Prisma.DossierWhereInput = {
    statut: {
      in: CLOSED_STATUTS,
    },
  };

  const q = search?.trim();

  if (q) {
    where.OR = [
      {
        numeroDossier: {
          contains: q,
        },
      },
      {
        numeroSinistre: {
          contains: q,
        },
      },
      {
        client: {
          contains: q,
        },
      },
      {
        partieAdverse: {
          contains: q,
        },
      },
    ];
  }

  return where;
}
export async function generateNextDossierNumber(): Promise<string> {
  const last = await prisma.dossier.findFirst({
    orderBy: {
      numeroDossier: 'desc',
    },
    select: {
      numeroDossier: true,
    },
  });

  const lastSuffix = last
    ? parseInt(last.numeroDossier.split('-').pop() ?? '0', 10)
    : 0;

  const next = (Number.isNaN(lastSuffix) ? 0 : lastSuffix) + 1;

  const year = new Date().getFullYear();

  return `DOS-${year}-${String(next).padStart(4, '0')}`;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface CreateDossierInput {
  numeroSinistre: string;
  type: DossierType;
  agence: string;
  client: string;
  dateSinistre: string;
  statut?: DossierStatut;
  partieAdverse: string | null;
  agenceAdverse: string | null;
}

export function validateCreateDossier(body: unknown): CreateDossierInput {
  if (typeof body !== 'object' || body === null) {
    throw new ApiError(400, 'Corps de requête invalide.');
  }

  const b = body as Record<string, unknown>;

  const numeroSinistre =
    typeof b.numeroSinistre === 'string' ? b.numeroSinistre.trim() : '';

  const client = typeof b.client === 'string' ? b.client.trim() : '';

  const agence = typeof b.agence === 'string' ? b.agence.trim() : '';

  const dateSinistre = typeof b.dateSinistre === 'string' ? b.dateSinistre : '';

  const type = b.type as DossierType;

  const statut = (b.statut as DossierStatut | undefined) ?? undefined;

  const errors: string[] = [];

  if (!numeroSinistre) {
    errors.push('numeroSinistre est requis.');
  }

  if (!client) {
    errors.push('client est requis.');
  }

  if (!agence) {
    errors.push('agence est requis.');
  }

  if (!dateSinistre || Number.isNaN(Date.parse(dateSinistre))) {
    errors.push('dateSinistre doit être une date valide.');
  }

  if (!DOSSIER_TYPES.includes(type)) {
    errors.push(`type doit être l'un de: ${DOSSIER_TYPES.join(', ')}`);
  }

  if (statut && !DOSSIER_STATUTS.includes(statut)) {
    errors.push(`statut doit être l'un de: ${DOSSIER_STATUTS.join(', ')}`);
  }

  if (errors.length) {
    throw new ApiError(400, errors.join(' '));
  }

  return {
    numeroSinistre,
    type,
    agence,
    client,
    dateSinistre,
    statut,
    partieAdverse: optionalString(b.partieAdverse),
    agenceAdverse: optionalString(b.agenceAdverse),
  };
}

export interface UpdateDossierInput {
  numeroSinistre?: string;
  type?: DossierType;
  agence?: string;
  client?: string;
  dateSinistre?: string;
  statut?: DossierStatut;
  dateCloture?: string | null;
  partieAdverse?: string | null;
  agenceAdverse?: string | null;
}

export function validateUpdateDossier(body: unknown): UpdateDossierInput {
  if (typeof body !== 'object' || body === null) {
    throw new ApiError(400, 'Corps de requête invalide.');
  }

  const b = body as Record<string, unknown>;

  const result: UpdateDossierInput = {};
  const errors: string[] = [];

  if (b.numeroSinistre !== undefined) {
    if (typeof b.numeroSinistre !== 'string' || !b.numeroSinistre.trim()) {
      errors.push('numeroSinistre doit être une chaîne non vide.');
    } else {
      result.numeroSinistre = b.numeroSinistre.trim();
    }
  }

  if (b.client !== undefined) {
    if (typeof b.client !== 'string' || !b.client.trim()) {
      errors.push('client doit être une chaîne non vide.');
    } else {
      result.client = b.client.trim();
    }
  }

  if (b.agence !== undefined) {
    if (typeof b.agence !== 'string' || !b.agence.trim()) {
      errors.push('agence doit être une chaîne non vide.');
    } else {
      result.agence = b.agence.trim();
    }
  }

  if (b.dateSinistre !== undefined) {
    if (
      typeof b.dateSinistre !== 'string' ||
      Number.isNaN(Date.parse(b.dateSinistre))
    ) {
      errors.push('dateSinistre doit être une date valide.');
    } else {
      result.dateSinistre = b.dateSinistre;
    }
  }

  if (b.type !== undefined) {
    if (!DOSSIER_TYPES.includes(b.type as DossierType)) {
      errors.push(`type doit être l'un de: ${DOSSIER_TYPES.join(', ')}`);
    } else {
      result.type = b.type as DossierType;
    }
  }

  if (b.statut !== undefined) {
    if (!DOSSIER_STATUTS.includes(b.statut as DossierStatut)) {
      errors.push(`statut doit être l'un de: ${DOSSIER_STATUTS.join(', ')}`);
    } else {
      result.statut = b.statut as DossierStatut;
    }
  }
  if (b.partieAdverse !== undefined) {
    result.partieAdverse = optionalString(b.partieAdverse);
  }

  if (b.agenceAdverse !== undefined) {
    result.agenceAdverse = optionalString(b.agenceAdverse);
  }
  if (errors.length) {
    throw new ApiError(400, errors.join(' '));
  }

  return result;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
