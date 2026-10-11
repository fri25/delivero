import { IsIn } from 'class-validator';
import { USAGES_MEDIA, type UsageMedia } from '../medias.service';

export class SignerMediaDto {
  @IsIn(USAGES_MEDIA)
  usage!: UsageMedia;
}
