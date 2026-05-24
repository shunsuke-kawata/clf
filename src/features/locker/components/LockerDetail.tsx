import type { LockerWithPhotos } from "@/features/locker/schemas/locker";
import { getPhotoUrl } from "@/lib/utils/photo";

type Props = {
  locker: LockerWithPhotos;
  supabaseUrl: string;
};

export function LockerDetail({ locker, supabaseUrl }: Props) {
  const photos = [...(locker.locker_photos ?? [])].sort((a, b) => a.order_index - b.order_index);

  return (
    <>
      {photos.length > 0 && (
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pt-4 pb-2">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={getPhotoUrl(supabaseUrl, photo.storage_key)}
              alt="ロッカー写真"
              className="h-52 w-auto flex-shrink-0 snap-start rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5 px-4 pt-4">
        {locker.pricing.length > 0 && (
          <section>
            <h2 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
              料金
            </h2>
            <div className="flex flex-wrap gap-2">
              {locker.pricing.map((price, i) => (
                <span key={i} className="bg-muted rounded-full px-3 py-1.5 text-sm font-medium">
                  ¥{price.toLocaleString()}
                </span>
              ))}
            </div>
          </section>
        )}

        {locker.note && (
          <section>
            <h2 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
              メモ
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{locker.note}</p>
          </section>
        )}

        {locker.pricing.length === 0 && !locker.note && photos.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">情報がありません</p>
        )}
      </div>
    </>
  );
}
