import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class ClesAbonnementPushDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  auth!: string;
}

/** Shape of PushSubscription.toJSON() in the browser. */
export class AbonnementPushDto {
  @IsUrl({ protocols: ['https'], require_tld: true })
  @MaxLength(1000)
  endpoint!: string;

  @ValidateNested()
  @Type(() => ClesAbonnementPushDto)
  keys!: ClesAbonnementPushDto;
}

export class DesabonnementPushDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string;
}
