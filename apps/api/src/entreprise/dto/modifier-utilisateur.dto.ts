import { IsIn, IsOptional } from 'class-validator';
import { ROLES_ATTRIBUABLES, type RoleAttribuable } from '../../auth/roles';

export class ModifierUtilisateurDto {
  @IsOptional()
  @IsIn(ROLES_ATTRIBUABLES)
  role?: RoleAttribuable;

  @IsOptional()
  @IsIn(['actif', 'suspendu'])
  statut?: 'actif' | 'suspendu';
}
