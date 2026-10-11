import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/orders/StarRating';
import type { NoteInput } from '@/api/notations';
import type { CibleNotation, NotationResume } from '@/api/types';

export interface CibleANoter {
  cible: CibleNotation;
  /** e.g. "Le restaurant Okoti Saveurs", "Votre livreur Koffi". */
  libelle: string;
}

/**
 * F-CLI-08: rating after delivery. Renders nothing before delivery; once
 * everything is rated, shows the given marks instead of the form.
 */
export function NotationCard({
  livree,
  cibles,
  notations,
  enCours,
  onNoter,
}: {
  livree: boolean;
  cibles: CibleANoter[];
  notations: NotationResume[];
  enCours: boolean;
  onNoter: (notes: NoteInput[], callbacks: { onSuccess: () => void; onError: (error: Error) => void }) => void;
}) {
  const restantes = cibles.filter((c) => !notations.some((n) => n.cible === c.cible));
  const [notes, setNotes] = useState<Partial<Record<CibleNotation, number>>>({});
  const [commentaire, setCommentaire] = useState('');

  if (!livree || cibles.length === 0) return null;

  if (restantes.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border px-3 py-2 text-sm">
        <span className="text-muted-foreground">Merci pour votre avis</span>
        {notations.map((n) => (
          <span key={n.cible} className="inline-flex items-center gap-1 font-medium">
            {n.cible === 'partenaire' ? 'Restaurant' : 'Livreur'} {n.note}
            <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
          </span>
        ))}
      </div>
    );
  }

  const aNoter = restantes.filter((c) => notes[c.cible]);

  return (
    <form
      className="space-y-4 rounded-xl border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onNoter(
          aNoter.map((c) => ({
            cible: c.cible,
            note: notes[c.cible]!,
            commentaire: commentaire.trim() || undefined,
          })),
          {
            onSuccess: () => toast.success('Merci pour votre avis !'),
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <p className="font-semibold">Comment s’est passée votre commande ?</p>
      {restantes.map((c) => (
        <div key={c.cible} className="space-y-1">
          <p className="text-sm text-muted-foreground">{c.libelle}</p>
          <StarRating
            label={c.libelle}
            value={notes[c.cible] ?? 0}
            onChange={(note) => setNotes({ ...notes, [c.cible]: note })}
          />
        </div>
      ))}
      <Textarea
        placeholder="Un commentaire ? (facultatif)"
        maxLength={500}
        value={commentaire}
        onChange={(event) => setCommentaire(event.target.value)}
      />
      <Button type="submit" className="w-full" disabled={enCours || aNoter.length === 0}>
        {enCours ? 'Envoi...' : 'Envoyer mon avis'}
      </Button>
    </form>
  );
}
