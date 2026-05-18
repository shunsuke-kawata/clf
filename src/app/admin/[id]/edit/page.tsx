import { notFound } from "next/navigation";
import { LockerForm } from "@/components/form/LockerForm";
import type { LockerWithPhotos } from "@/lib/schemas/locker";

type Props = { params: Promise<{ id: string }> };

async function getLocker(id: string): Promise<LockerWithPhotos | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/lockers/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch locker");
  return res.json();
}

export default async function EditLockerPage({ params }: Props) {
  const { id } = await params;
  const locker = await getLocker(id);
  if (!locker) notFound();

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">編集</h1>
      <LockerForm
        mode="edit"
        lockerId={locker.id}
        defaultValues={{
          name: locker.name,
          lat: locker.lat,
          lng: locker.lng,
          note: locker.note ?? "",
          pricing: locker.pricing,
        }}
      />
    </main>
  );
}
