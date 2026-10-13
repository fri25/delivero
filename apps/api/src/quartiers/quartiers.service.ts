import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Quartier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuartierDto } from './dto/create-quartier.dto';
import { UpdateQuartierDto } from './dto/update-quartier.dto';

const SELECT_PUBLIC = {
  id: true,
  nom: true,
  fraisLivraison: true,
  autre: true,
} satisfies Prisma.QuartierSelect;

type Client = Prisma.TransactionClient | PrismaService;

@Injectable()
export class QuartiersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Client-facing list: active ones, "Autre quartier" last. */
  listerActifs() {
    return this.prisma.quartier.findMany({
      where: { actif: true },
      select: SELECT_PUBLIC,
      orderBy: [{ autre: 'asc' }, { nom: 'asc' }],
    });
  }

  listerTous() {
    return this.prisma.quartier.findMany({
      orderBy: [{ autre: 'asc' }, { nom: 'asc' }],
    });
  }

  async creer(dto: CreateQuartierDto) {
    try {
      return await this.prisma.quartier.create({
        data: { nom: dto.nom.trim(), fraisLivraison: dto.fraisLivraison },
      });
    } catch (error) {
      throw this.conflitDeNom(error);
    }
  }

  async modifier(id: string, dto: UpdateQuartierDto) {
    const quartier = await this.prisma.quartier.findUnique({ where: { id } });
    if (!quartier) {
      throw new NotFoundException('Quartier introuvable.');
    }
    // "Autre quartier" is the fallback for unlisted names: it stays available.
    if (quartier.autre && dto.actif === false) {
      throw new BadRequestException(
        '« Autre quartier » ne peut pas être désactivé.',
      );
    }
    try {
      return await this.prisma.quartier.update({
        where: { id },
        data: {
          nom: dto.nom?.trim(),
          fraisLivraison: dto.fraisLivraison,
          actif: dto.actif,
        },
      });
    } catch (error) {
      throw this.conflitDeNom(error);
    }
  }

  /**
   * Checks the neighbourhood a client picked. For "Autre quartier" the name
   * they typed (`precision`) is mandatory. Returns the priced entry and the
   * name to store.
   */
  async resoudre(
    quartierId: string,
    precision: string | null | undefined,
    client: Client = this.prisma,
  ): Promise<{ quartier: Quartier; nom: string }> {
    const quartier = await client.quartier.findUnique({
      where: { id: quartierId },
    });
    if (!quartier || !quartier.actif) {
      throw new BadRequestException(
        'Quartier inconnu. Choisissez-le dans la liste.',
      );
    }
    const nomSaisi = precision?.trim();
    if (quartier.autre && !nomSaisi) {
      throw new BadRequestException('Précisez le nom de votre quartier.');
    }
    return { quartier, nom: quartier.autre ? nomSaisi! : quartier.nom };
  }

  /** Several at once (course stops), in the given order. */
  async resoudrePlusieurs(
    ids: string[],
    client: Client = this.prisma,
  ): Promise<Quartier[]> {
    const trouves = await client.quartier.findMany({
      where: { id: { in: ids }, actif: true },
    });
    const parId = new Map(trouves.map((q) => [q.id, q]));
    return ids.map((id) => {
      const quartier = parId.get(id);
      if (!quartier) {
        throw new BadRequestException(
          'Quartier inconnu. Choisissez-le dans la liste.',
        );
      }
      return quartier;
    });
  }

  private conflitDeNom(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException('Un quartier porte déjà ce nom.');
    }
    return error;
  }
}
