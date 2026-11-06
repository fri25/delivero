import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class DomaineDto {
  /** Host name only: no scheme, port or path. */
  @Matches(
    /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
    {
      message: 'Nom de domaine attendu, par exemple livraison.exemple.bj.',
    },
  )
  domaine!: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}
