import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// V12 : JwtAuthGuard est désormais global (deny-by-default) — un endpoint qui
// doit rester accessible sans jeton doit le déclarer explicitement avec ce
// décorateur plutôt que par absence de guard.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
