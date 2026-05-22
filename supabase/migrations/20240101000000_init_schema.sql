-- lockers テーブル
CREATE TABLE public.lockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  note TEXT,
  pricing JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- locker_photos テーブル
CREATE TABLE public.locker_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locker_id UUID NOT NULL REFERENCES public.lockers(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Storage バケット（locker-photos）
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('locker-photos', 'locker-photos', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage の公開読み取りポリシー
CREATE POLICY "public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'locker-photos');

-- Storage の全操作ポリシー（service_role が使用）
CREATE POLICY "service role write" ON storage.objects
  FOR ALL USING (true);
