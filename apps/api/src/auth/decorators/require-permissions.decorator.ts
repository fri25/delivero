import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

// V13 : jusqu'ici les permissions seedées (docs/acteurs.md, matrice de
// permissions) n'étaient jamais évaluées — seul @Roles() comptait. Ce
// décorateur les rend applicables. Toutes les permissions listées sont
// requises (ET, pas OU). Les rôles du back-office en portent ; depuis
// l'étape 8, gestionnaire en a moins qu'admin_entreprise, sans re-câbler
// les contrôleurs.
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
