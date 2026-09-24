import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// S'appuie sur la zone/grille et le livreur de démonstration créés par
// `prisma/seed.ts` (zone "Natitingou centre", livreur +22900000003 /
// demo12345) — la base doit avoir été seedée avant de lancer ce test
// (pnpm prisma:seed).
const DEMO_LIVREUR = { telephone: '+22900000003', motDePasse: 'demo12345' };

interface AuthResponseBody {
  accessToken: string;
}
interface AdresseBody {
  id: string;
}
interface CommandeColisBody {
  id: string;
  statut: string;
  commande: { montantTotal: string | number };
  codeOtp?: string;
}

describe('Colis (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let clientToken: string;
  let clientAdresseId: string;
  let livreurToken: string;
  let zoneId: string;

  beforeAll(async () => {
    // Ces suites valident l'implémentation complète (encaissement espèces,
    // portefeuille livreur, contre-remboursement), qui reste en place : le
    // périmètre V1 est une configuration de déploiement, pas une suppression
    // de code. On ouvre donc explicitement ce que la V1 ferme. À poser avant
    // la construction du module : dotenv n'écrase pas une variable déjà
    // présente dans process.env.
    process.env.MODES_PAIEMENT_ACTIFS = 'mobile_money,especes';
    process.env.CONTRE_REMBOURSEMENT_ACTIF = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    // Mêmes options que main.ts : sans ça, les DTO ne sont ni validés ni
    // transformés (@Type, @IsNumber...) dans ce test, contrairement à la
    // vraie app.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer();

    const telephone = `+229${Date.now()}`;
    const registerRes = await request(server)
      .post('/api/auth/register')
      .send({ telephone, motDePasse: 'motdepasse123', nom: 'Expéditeur E2E' })
      .expect(201);
    clientToken = (registerRes.body as AuthResponseBody).accessToken;

    const adresseRes = await request(server)
      .post('/api/adresses')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        libelle: 'Domicile',
        pointDeRepere: 'Repère e2e colis',
        estParDefaut: true,
      })
      .expect(201);
    clientAdresseId = (adresseRes.body as AdresseBody).id;

    const livreurLoginRes = await request(server)
      .post('/api/auth/login')
      .send(DEMO_LIVREUR)
      .expect(200);
    livreurToken = (livreurLoginRes.body as AuthResponseBody).accessToken;

    // Aucun endpoint de liste des zones n'existe côté API : on récupère
    // l'id de la zone de seed via le profil du livreur de démonstration
    // (même zone que la grille tarifaire Colis seedée, voir prisma/seed.ts).
    zoneId = await resolveZoneId(server, livreurToken);
  });

  afterAll(async () => {
    await app.close();
  });

  it('estimation : tarif retourné pour un colis moyen', async () => {
    const res = await request(server)
      .get('/api/commandes/colis/estimation')
      .set('Authorization', `Bearer ${clientToken}`)
      .query({ zoneId, taille: 'moyen' })
      .expect(200);
    expect((res.body as { tarif: number }).tarif).toBeGreaterThan(0);
  });

  it('parcours complet : création -> disponibles -> prise en charge -> livraison', async () => {
    const estimationRes = await request(server)
      .get('/api/commandes/colis/estimation')
      .set('Authorization', `Bearer ${clientToken}`)
      .query({ zoneId, taille: 'moyen' })
      .expect(200);
    const tarifAttendu = (estimationRes.body as { tarif: number }).tarif;

    // Aucun champ de montant/tarif n'existe dans CreateCommandeColisDto : le
    // tarif est toujours recalculé côté serveur, il n'y a même pas de champ à
    // falsifier dans le payload (forbidNonWhitelisted rejetterait de toute
    // façon un champ inconnu comme `montant`).
    const createRes = await request(server)
      .post('/api/commandes/colis')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        adresseEnlevementId: clientAdresseId,
        zoneId,
        taille: 'moyen',
        destinataireNom: 'Destinataire E2E',
        destinataireTelephone: '+22991234567',
        adresseLivraison: 'Quartier X, Natitingou',
        pointDeRepereLivraison: 'Près du grand manguier',
        fragile: true,
        montantContreRemboursement: 5000,
        modePaiement: 'especes',
        conditionsAcceptees: true,
      })
      .expect(201);
    const commandeColis = createRes.body as CommandeColisBody;
    expect(commandeColis.statut).toBe('confirmee');
    expect(Number(commandeColis.commande.montantTotal)).toBe(tarifAttendu);
    const colisId = commandeColis.id;

    // Le client, propriétaire, voit le code de remise.
    const detailClientRes = await request(server)
      .get(`/api/commandes/colis/${colisId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
    const codeOtp = (detailClientRes.body as CommandeColisBody).codeOtp;
    expect(codeOtp).toBeTruthy();

    const disponiblesRes = await request(server)
      .get('/api/commandes/colis/disponibles')
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);
    const disponibles = disponiblesRes.body as CommandeColisBody[];
    expect(disponibles.some((c) => c.id === colisId)).toBe(true);
    // Le code de remise ne doit jamais apparaître côté livreur.
    expect(disponibles.find((c) => c.id === colisId)?.codeOtp).toBeUndefined();

    await request(server)
      .patch(`/api/commandes/colis/${colisId}/prendre-en-charge`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    await request(server)
      .patch(`/api/commandes/colis/${colisId}/recupere`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    // Transition illégale : en-route ne peut pas suivre directement recupere
    // deux fois -> on retente en_route -> recupere pour vérifier le 409,
    // sans perturber le parcours nominal.
    await request(server)
      .patch(`/api/commandes/colis/${colisId}/en-route`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    // OTP erroné -> refusé, statut inchangé.
    await request(server)
      .patch(`/api/commandes/colis/${colisId}/livraison`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ codeOtp: '000000', montantEncaisse: 5000 })
      .expect(400);

    const apresOtpErroneRes = await request(server)
      .get('/api/commandes/colis/mes-courses')
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);
    const apresOtpErrone = (apresOtpErroneRes.body as CommandeColisBody[]).find(
      (c) => c.id === colisId,
    );
    expect(apresOtpErrone?.statut).toBe('en_route');

    await request(server)
      .patch(`/api/commandes/colis/${colisId}/livraison`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ codeOtp, montantEncaisse: 5000 })
      .expect(200);

    const suiviRes = await request(server)
      .get(`/api/commandes/colis/suivi/${colisId}`)
      .expect(200);
    const suivi = suiviRes.body as Record<string, unknown>;
    expect(suivi.statut).toBe('livre');
    expect(suivi).not.toHaveProperty('codeOtp');
    expect(suivi).not.toHaveProperty('commande');
  });

  it('colis planifié pour demain : absent des disponibles', async () => {
    const demain = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const createRes = await request(server)
      .post('/api/commandes/colis')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        adresseEnlevementId: clientAdresseId,
        zoneId,
        taille: 'petit',
        destinataireNom: 'Destinataire planifié',
        destinataireTelephone: '+22991234568',
        adresseLivraison: 'Quartier Y, Natitingou',
        pointDeRepereLivraison: 'Près du marché',
        modePaiement: 'mobile_money',
        conditionsAcceptees: true,
        programmationAt: demain,
      })
      .expect(201);
    const colisId = (createRes.body as CommandeColisBody).id;

    const disponiblesRes = await request(server)
      .get('/api/commandes/colis/disponibles')
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);
    const disponibles = disponiblesRes.body as CommandeColisBody[];
    expect(disponibles.some((c) => c.id === colisId)).toBe(false);
  });

  it('deux prises en charge concurrentes : une seule réussit', async () => {
    const createRes = await request(server)
      .post('/api/commandes/colis')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        adresseEnlevementId: clientAdresseId,
        zoneId,
        taille: 'petit',
        destinataireNom: 'Destinataire concurrence',
        destinataireTelephone: '+22991234569',
        adresseLivraison: 'Quartier Z, Natitingou',
        pointDeRepereLivraison: 'Près de la pharmacie',
        modePaiement: 'especes',
        conditionsAcceptees: true,
      })
      .expect(201);
    const colisId = (createRes.body as CommandeColisBody).id;

    const [first, second] = await Promise.all([
      request(server)
        .patch(`/api/commandes/colis/${colisId}/prendre-en-charge`)
        .set('Authorization', `Bearer ${livreurToken}`),
      request(server)
        .patch(`/api/commandes/colis/${colisId}/prendre-en-charge`)
        .set('Authorization', `Bearer ${livreurToken}`),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('livreur non attributaire : refusé sur "recupere"', async () => {
    const createRes = await request(server)
      .post('/api/commandes/colis')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        adresseEnlevementId: clientAdresseId,
        zoneId,
        taille: 'petit',
        destinataireNom: 'Destinataire non attribue',
        destinataireTelephone: '+22991234570',
        adresseLivraison: 'Quartier W, Natitingou',
        pointDeRepereLivraison: 'Près du collège',
        modePaiement: 'especes',
        conditionsAcceptees: true,
      })
      .expect(201);
    const colisId = (createRes.body as CommandeColisBody).id;

    // Jamais pris en charge : commande.livreurId reste null, donc "ne vous a
    // pas été attribuée" (403) plutôt que "n'existe pas".
    await request(server)
      .patch(`/api/commandes/colis/${colisId}/recupere`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(403);
  });

  it('transition illégale : en-route sans être passé par colis_recupere -> 409, statut inchangé', async () => {
    const createRes = await request(server)
      .post('/api/commandes/colis')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        adresseEnlevementId: clientAdresseId,
        zoneId,
        taille: 'petit',
        destinataireNom: 'Destinataire transition illégale',
        destinataireTelephone: '+22991234571',
        adresseLivraison: 'Quartier V, Natitingou',
        pointDeRepereLivraison: 'Près de la mairie',
        modePaiement: 'especes',
        conditionsAcceptees: true,
      })
      .expect(201);
    const colisId = (createRes.body as CommandeColisBody).id;

    await request(server)
      .patch(`/api/commandes/colis/${colisId}/prendre-en-charge`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    // Statut réel après prise en charge : livreur_en_route_enlevement, pas
    // colis_recupere -> en-route doit être refusé.
    await request(server)
      .patch(`/api/commandes/colis/${colisId}/en-route`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(409);

    const detailRes = await request(server)
      .get(`/api/commandes/colis/${colisId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
    expect((detailRes.body as CommandeColisBody).statut).toBe(
      'livreur_en_route_enlevement',
    );
  });
});

// Aucun endpoint de liste des zones n'existe côté API : on s'appuie sur la
// zone du livreur de démonstration lui-même (LivreursService n'expose pas non
// plus l'id de zone) — on passe par la disponibilité Repas, qui filtre déjà
// par `livreur.zoneId`, pour obtenir un id de zone valide sans en exposer un
// nouvel endpoint juste pour ce test.
async function resolveZoneId(
  server: App,
  livreurToken: string,
): Promise<string> {
  const meRes = await request(server)
    .get('/api/livreurs/me')
    .set('Authorization', `Bearer ${livreurToken}`)
    .expect(200);
  return (meRes.body as { zoneId: string }).zoneId;
}
