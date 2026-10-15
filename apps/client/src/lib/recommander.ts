import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from '@/api/client';
import type {
  CommandeColis,
  CommandeCoursesExpress,
  CommandeRepas,
  RestaurantDetail,
  TailleColis,
} from '@/api/types';
import { useCartStore } from '@/stores/cart-store';

// F-CLI-07 : « Recommander en un clic ». Repas refills the cart at today's
// prices; Colis and Courses express reopen their form pre-filled (router
// state), so the client still reviews price and details before confirming.

export interface ModeleColis {
  adresseEnlevementId: string;
  zoneId: string;
  taille: TailleColis;
  destinataireNom: string;
  destinataireTelephone: string;
  quartierLivraisonId?: string;
  adresseLivraison: string;
  pointDeRepereLivraison: string;
  valeurDeclaree: string;
  fragile: boolean;
  nature?: string;
}

export function modeleColis(commande: CommandeColis): ModeleColis {
  return {
    adresseEnlevementId: commande.adresseEnlevement.id,
    zoneId: commande.zone.id,
    taille: commande.taille,
    destinataireNom: commande.destinataireNom,
    destinataireTelephone: commande.destinataireTelephone,
    quartierLivraisonId: commande.quartierLivraisonId ?? undefined,
    // Stored as "Quartier — rue": the neighbourhood is re-picked from the list.
    adresseLivraison: commande.quartierLivraisonId
      ? (commande.adresseLivraison.split(' — ').slice(1).join(' — '))
      : commande.adresseLivraison,
    pointDeRepereLivraison: commande.pointDeRepereLivraison,
    valeurDeclaree: commande.valeurDeclaree ? String(Number(commande.valeurDeclaree)) : '',
    fragile: commande.fragile,
    ...(commande.nature ? { nature: commande.nature } : {}),
  };
}

export interface ModeleCoursesExpress {
  zoneId: string;
  description: string;
  etapes: { description: string; pointDeRepere: string; adresse: string; quartierId?: string }[];
}

export function modeleCoursesExpress(commande: CommandeCoursesExpress): ModeleCoursesExpress {
  return {
    zoneId: commande.zone.id,
    description: commande.description,
    etapes: commande.etapes.map((etape) => ({
      description: etape.description,
      pointDeRepere: etape.pointDeRepere,
      quartierId: etape.quartierId ?? undefined,
      // Stored as "Quartier — lieu": the neighbourhood is re-picked from the list.
      adresse: (etape.quartierId ? etape.adresse?.split(' — ').slice(1).join(' — ') : etape.adresse) ?? '',
    })),
  };
}

/** Reads the template passed by "Recommander" through router state. */
export function lireModele<T>(state: unknown): T | undefined {
  return (state as { modele?: T } | null)?.modele;
}

export function useRecommanderRepas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enCours, setEnCours] = useState(false);

  const recommander = async (commande: CommandeRepas) => {
    const cart = useCartStore.getState();
    // Replace, never merge: merging would silently double quantities.
    if (
      cart.items.length > 0 &&
      !window.confirm(`Votre panier actuel (${cart.restaurantNom}) sera remplacé. Continuer ?`)
    ) {
      return;
    }

    setEnCours(true);
    try {
      // Current menu, not the old order lines: prices and availability change.
      const restaurant = await queryClient.fetchQuery({
        queryKey: ['restaurant', commande.partenaire.id],
        queryFn: () => apiFetch<RestaurantDetail>(`/restaurants/${commande.partenaire.id}`),
      });
      if (!restaurant.statutOuverture) {
        toast.error(`${restaurant.nom} est fermé pour le moment.`);
        return;
      }

      const platsActuels = new Map(restaurant.plats.map((plat) => [plat.id, plat]));
      const indisponibles: string[] = [];
      cart.clear();
      for (const ligne of commande.lignes) {
        const plat = platsActuels.get(ligne.platId);
        if (!plat?.disponible) {
          indisponibles.push(ligne.plat.nom);
          continue;
        }
        useCartStore.getState().addItem(restaurant.id, restaurant.nom, {
          platId: plat.id,
          nom: plat.nom,
          prixUnitaire: Number(plat.prix),
          quantite: ligne.quantite,
          instructions: ligne.instructions ?? undefined,
        });
      }

      if (indisponibles.length === commande.lignes.length) {
        toast.error('Aucun de ces plats n’est disponible aujourd’hui.');
        return;
      }
      if (indisponibles.length > 0) {
        toast.info(`Plus disponible : ${indisponibles.join(', ')}.`);
      }
      navigate('/panier');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnCours(false);
    }
  };

  return { recommander, enCours };
}
