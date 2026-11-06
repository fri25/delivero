import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ROLES_ATTRIBUABLES, type RoleAttribuable } from '../../auth/roles';

export class InviterUtilisateurDto {
  @IsString()
  @IsNotEmpty()
  telephone!: string;

  @IsString()
  @MinLength(1)
  nom!: string;

  @IsIn(ROLES_ATTRIBUABLES)
  role!: RoleAttribuable;

  /** Required for a new account; an existing one keeps its password. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  motDePasse?: string;
}
