import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic() {
    return this.prisma.zone.findMany({
      select: { id: true, nom: true },
      orderBy: { nom: 'asc' },
    });
  }
}
