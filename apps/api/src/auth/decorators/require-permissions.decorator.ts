import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

// V13 : jusqu'ici les permissions seedées (docs/acteurs.md, matrice de
// permissions) n'étaient jamais évaluées — seul @Roles() comptait. Ce
// décorateur les rend applicables. Toutes les permissions listées sont
// requises (ET, pas OU) ; un seul rôle (admin_dispatcher) en porte
// aujourd'hui, mais le but est de pouvoir introduire un second rôle
// admin plus restreint sans re-câbler chaque contrôleur.
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
