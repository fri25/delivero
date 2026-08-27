import { Skeleton } from '@/components/ui/skeleton';
import { AjouterPlatForm } from '@/components/menu/AjouterPlatForm';
import { PlatRow } from '@/components/menu/PlatRow';
import { useMesPlats } from '@/api/restaurant';

export function MenuPage() {
  const { data: plats, isPending } = useMesPlats();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Menu</h1>

      <AjouterPlatForm />

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !plats || plats.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun plat pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {plats.map((plat) => (
            <PlatRow key={plat.id} plat={plat} />
          ))}
        </div>
      )}
    </div>
  );
}
