import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CibleNotation } from '@prisma/client';

export class NoteDto {
  @IsEnum(CibleNotation)
  cible!: CibleNotation;

  @IsInt()
  @Min(1)
  @Max(5)
  note!: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  commentaire?: string;
}

/** Rates the partner and/or the livreur of one order in a single call. */
export class NoterCommandeDto {
  @ValidateNested({ each: true })
  @Type(() => NoteDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  notes!: NoteDto[];
}
