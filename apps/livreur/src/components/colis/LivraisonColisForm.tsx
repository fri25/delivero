import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLivrerColis } from '@/api/commandes-colis';
import type { CommandeColis } from '@/api/types';

export function LivraisonColisForm({ commande }: { commande: CommandeColis }) {
  const [codeOtp, setCodeOtp] = useState('');
  const [nomReceptionnaire, setNomReceptionnaire] = useState('');
  const [montantEncaisse, setMontantEncaisse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const livrer = useLivrerColis();

  const contreRembourseAttendu = commande.montantContreRemboursement !== null;

  const confirmer = () => {
    setErreur(null);

    if (!codeOtp.trim()) {
      setErreur('Le code de remise fourni par le destinataire est obligatoire.');
      return;
    }
    if (contreRembourseAttendu && !montantEncaisse) {
      setErreur('Le montant encaissé est obligatoire pour ce colis (contre-remboursement).');
      return;
    }

    livrer.mutate(
      {
        id: commande.id,
        codeOtp: codeOtp.trim(),
        nomReceptionnaire: nomReceptionnaire.trim() || undefined,
        montantEncaisse: montantEncaisse ? Number(montantEncaisse) : undefined,
      },
      {
        // La saisie n'est volontairement pas réinitialisée en cas d'erreur
        // (ex. code de remise incorrect) : l'utilisateur ne doit pas tout
        // ressaisir.
        onError: (error) => setErreur(error.message),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium">Confirmer la livraison</p>

      <div className="space-y-1.5">
        <Label htmlFor={`otp-${commande.id}`}>Code de remise (fourni par le destinataire) *</Label>
        <Input
          id={`otp-${commande.id}`}
          inputMode="numeric"
          required
          value={codeOtp}
          onChange={(event) => setCodeOtp(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`receptionnaire-${commande.id}`}>Nom du réceptionnaire (optionnel)</Label>
        <Input
          id={`receptionnaire-${commande.id}`}
          value={nomReceptionnaire}
          onChange={(event) => setNomReceptionnaire(event.target.value)}
        />
      </div>

      {contreRembourseAttendu && (
        <div className="space-y-1.5">
          <Label htmlFor={`encaisse-${commande.id}`}>Montant encaissé (FCFA)</Label>
          <Input
            id={`encaisse-${commande.id}`}
            type="number"
            min={1}
            inputMode="numeric"
            value={montantEncaisse}
            onChange={(event) => setMontantEncaisse(event.target.value)}
          />
        </div>
      )}

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      <Button className="w-full" disabled={livrer.isPending} onClick={confirmer}>
        {livrer.isPending ? 'Envoi...' : 'Confirmer la livraison'}
      </Button>
    </div>
  );
}
