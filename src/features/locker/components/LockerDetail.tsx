import type { LockerWithPhotos } from "@/features/locker/schemas/locker";
import { getPhotoUrl } from "@/lib/utils/photo";

type Props = {
  locker: LockerWithPhotos;
  supabaseUrl: string;
};

export function LockerDetail({ locker, supabaseUrl }: Props) {
  const photos = [...(locker.locker_photos ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <>
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-2 snap-x snap-mandatory">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={getPhotoUrl(supabaseUrl, photo.storage_key)}
              alt="ロッカー写真"
              className="h-52 w-auto rounded-xl object-cover flex-shrink-0 snap-start"
            />
          ))}
        </div>
      )}

      <div className="px-4 pt-4 flex flex-col gap-5">
        {locker.pricing.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              料金
            </h2>
            <div className="flex flex-wrap gap-2">
              {locker.pricing.map((price, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium"
                >
                  ¥{price.toLocaleString()}
                </span>
              ))}
            </div>
          </section>
        )}

        {locker.note && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              メモ
            </h2>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{locker.note}</p>
          </section>
        )}

        {locker.pricing.length === 0 && !locker.note && photos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">情報がありません</p>
        )}
      </div>
    </>
  );
}
