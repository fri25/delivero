import { IsIn, IsString, MinLength } from 'class-validator';

/** FedaPay account of the company (decision Q-MT-4). Never returned. */
export class FedapayDto {
  @IsString()
  @MinLength(10)
  cleSecrete!: string;

  @IsString()
  @MinLength(10)
  secretWebhook!: string;

  @IsIn(['sandbox', 'live'])
  environnement!: 'sandbox' | 'live';
}
