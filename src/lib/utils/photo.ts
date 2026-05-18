const BUCKET = "locker-photos";

export function getPhotoUrl(supabaseUrl: string, storageKey: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storageKey}`;
}
