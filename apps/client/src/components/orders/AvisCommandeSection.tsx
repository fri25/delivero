import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAvisCommande, useCreerAvis, type CibleAvis } from '@/api/avis';

function Etoiles({
  cible,
  valeur,
  onChange,
  lectureSeule = false,
}: {
  cible: string;
  valeur: number;
  onChange?: (note: number) => void;
  lectureSeule?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role={lectureSeule ? 'img' : 'group'} aria-label={`Note ${cible}`}>
      {[1, 2, 3, 4, 5].map((note) => (
        <button
          key={note}
          type="button"
          disabled={lectureSeule}
          aria-label={`${note} étoile${note > 1 ? 's' : ''}`}
          aria-pressed={!lectureSeule ? valeur === note : undefined}
          onClick={() => onChange?.(note)}
          className="flex size-11 items-center justify-center rounded-lg text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
        >
          <Star className={`size-5 ${note <= valeur ? 'fill-primary' : ''}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function CibleAvisCard({
  commandeId,
  cible,
  type,
}: {
  commandeId: string;
  cible: CibleAvis;
  type: 'partenaire' | 'livreur';
}) {
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const mutation = useCreerAvis(commandeId);

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs text-muted-foreground">{type === 'partenaire' ? 'Restaurant' : 'Livreur'}</p><p className="font-semibold">{cible.nom}</p></div>
        {cible.avis && <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">Avis envoyé</span>}
      </div>
      {cible.avis ? (
        <div className="mt-3"><Etoiles cible={type} valeur={cible.avis.note} lectureSeule />{cible.avis.commentaire && <p className="mt-1 text-sm text-muted-foreground">« {cible.avis.commentaire} »</p>}</div>
      ) : cible.autorise ? (
        <form className="mt-3 space-y-3" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ cible: type, note, commentaire: commentaire.trim() || undefined }, {
            onSuccess: () => toast.success('Merci pour votre avis.'),
            onError: (error) => toast.error(error.message),
          });
        }}>
          <div><p className="text-sm font-medium">Comment s’est passée la prestation ?</p><Etoiles cible={type} valeur={note} onChange={setNote} /></div>
          <Textarea aria-label="Commentaire facultatif" placeholder="Un commentaire (facultatif)" maxLength={500} value={commentaire} onChange={(event) => setCommentaire(event.target.value)} />
          <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending}>{mutation.isPending ? 'Envoi…' : 'Envoyer mon avis'}</Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Vous pourrez laisser votre avis après la livraison.</p>
      )}
    </div>
  );
}

export function AvisCommandeSection({ commandeId, prestationTerminee }: { commandeId: string; prestationTerminee: boolean }) {
  const { data, isError, refetch } = useAvisCommande(commandeId, prestationTerminee);
  if (isError) {
    return <div className="rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Les avis ne sont pas disponibles pour le moment.</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Réessayer</Button></div>;
  }
  const cibles = [
    data?.partenaire && { type: 'partenaire' as const, cible: data.partenaire },
    data?.livreur && { type: 'livreur' as const, cible: data.livreur },
  ].filter((value): value is { type: 'partenaire' | 'livreur'; cible: CibleAvis } => Boolean(value));
  if (!prestationTerminee || cibles.length === 0 || cibles.every(({ cible }) => !cible.autorise && !cible.avis)) return null;

  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-4 sm:p-5">
      <div><h2 className="font-heading text-lg font-semibold">Votre avis compte</h2><p className="text-sm text-muted-foreground">Évaluez les personnes qui ont participé à cette livraison.</p></div>
      {cibles.map(({ type, cible }) => <CibleAvisCard key={type} commandeId={commandeId} type={type} cible={cible} />)}
    </section>
  );
}
