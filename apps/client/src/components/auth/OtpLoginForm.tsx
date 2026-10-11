import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDemanderOtp, useVerifierOtp, type OtpDemande } from '@/api/auth';
import type { AuthResponse } from '@/api/types';

/**
 * F-CLI-01: sign-in, or sign-up for a new number, with a code received by
 * WhatsApp/SMS. Two steps: number, then code (+ name for a new account).
 */
export function OtpLoginForm({ onConnecte }: { onConnecte: (session: AuthResponse) => void }) {
  const demander = useDemanderOtp();
  const verifier = useVerifierOtp();
  const [telephone, setTelephone] = useState('');
  const [demande, setDemande] = useState<OtpDemande | null>(null);
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');

  const envoyerCode = () =>
    demander.mutate(telephone, {
      onSuccess: (resultat) => {
        setDemande(resultat);
        setCode('');
        toast.success('Code envoyé par WhatsApp ou SMS.');
      },
      onError: (error) => toast.error(error.message),
    });

  if (!demande) {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          envoyerCode();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="telephone-otp">Téléphone</Label>
          <Input
            id="telephone-otp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
            placeholder="01 57 86 69 59"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={demander.isPending}>
          {demander.isPending ? 'Envoi du code...' : 'Recevoir un code'}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        verifier.mutate(
          {
            telephone: demande.telephone,
            code,
            nom: demande.nouveauCompte ? nom.trim() : undefined,
          },
          {
            onSuccess: onConnecte,
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <p className="text-sm text-muted-foreground">
        Code envoyé au {demande.telephone}.{' '}
        <button type="button" className="underline" onClick={() => setDemande(null)}>
          Changer de numéro
        </button>
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="code-otp">Code reçu</Label>
        <Input
          id="code-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          placeholder="6 chiffres"
          required
        />
      </div>

      {demande.nouveauCompte && (
        <div className="space-y-1.5">
          <Label htmlFor="nom-otp">Votre nom</Label>
          <Input
            id="nom-otp"
            autoComplete="name"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">Nouveau numéro : votre compte sera créé.</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={verifier.isPending || code.length !== 6}>
        {verifier.isPending ? 'Vérification...' : demande.nouveauCompte ? 'Créer mon compte' : 'Se connecter'}
      </Button>

      <Button type="button" variant="ghost" className="w-full" disabled={demander.isPending} onClick={envoyerCode}>
        Renvoyer le code
      </Button>
    </form>
  );
}
