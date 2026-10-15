import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ContactInvite } from '@/api/invite';

/** Name + phone of a guest (F-CLI-02); the phone receives the tracking link. */
export function ContactInviteFields({
  value,
  onChange,
}: {
  value: ContactInvite;
  onChange: (value: ContactInvite) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="invite-nom">Votre nom</Label>
        <Input
          id="invite-nom"
          autoComplete="name"
          value={value.nom}
          onChange={(event) => onChange({ ...value, nom: event.target.value })}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-telephone">Votre téléphone</Label>
        <Input
          id="invite-telephone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01 XX XX XX XX"
          value={value.telephone}
          onChange={(event) => onChange({ ...value, telephone: event.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">
          Vous recevrez le lien de suivi par WhatsApp ou SMS. Le livreur pourra vous appeler.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-email">
          Votre e-mail <span className="text-xs font-normal text-muted-foreground">(facultatif)</span>
        </Label>
        <Input
          id="invite-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="exemple@domaine.bj"
          value={value.email ?? ''}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Pour recevoir le récapitulatif et le suivi de commande par e-mail.
        </p>
      </div>
    </div>
  );
}
