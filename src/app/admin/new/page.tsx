import { LockerForm } from "@/components/form/LockerForm";

export default function NewLockerPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">新規投稿</h1>
      <LockerForm mode="create" />
    </main>
  );
}
