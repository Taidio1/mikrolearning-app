-- Konfiguracja CORS dla Supabase Storage
-- Upewnij się, że zostaną ustawione właściwe nagłówki dla bucketa 'videos'

-- 1. Upewnij się, że bucket 'videos' istnieje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'videos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('videos', 'videos', true);
  END IF;
END $$;

-- 2. Ustaw właściwe polityki bezpieczeństwa dla bucketa 'videos'
-- Pozwól na odczyt dla wszystkich (publiczny bucket)
DROP POLICY IF EXISTS "Public Access Policy" ON storage.objects;
CREATE POLICY "Public Access Policy" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- 3. Konfiguracja ścieżek CORS dla głównej domeny i wszystkich domen testowych
insert into storage.cors (bucket_id, origins, methods, allowed_headers)
values
  ('videos', '{*}', '{GET,POST}', '{Content-Type,Authorization,Accept,Accept-Language,Content-Language,Origin,Range}')
on conflict (bucket_id, origins) do nothing;

-- 4. Aktualizacja uprawnień dla przesyłania plików (tylko uwierzytelnieni użytkownicy mogą dodawać pliki)
DROP POLICY IF EXISTS "Upload Policy" ON storage.objects;
CREATE POLICY "Upload Policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos');

-- 5. Aktualizacja uprawnień dla usuwania plików (tylko właściciel lub admin może usunąć)
DROP POLICY IF EXISTS "Delete Policy" ON storage.objects;
CREATE POLICY "Delete Policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'videos' AND (auth.uid() = owner OR auth.uid() IN (
    SELECT id FROM auth.users WHERE is_admin = true
  )));

-- 6. Dodatkowa tabela do przechowywania metadanych wideo
CREATE TABLE IF NOT EXISTS video_metadata (
  id UUID PRIMARY KEY REFERENCES videos(id),
  filename TEXT NOT NULL,
  duration NUMERIC,
  format TEXT,
  width INTEGER,
  height INTEGER,
  size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Trigger który automatycznie czyści tabele po usunięciu pliku
CREATE OR REPLACE FUNCTION cleanup_after_video_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Usuń polubienia
  DELETE FROM user_likes WHERE video_id = OLD.id;
  
  -- Usuń metadane
  DELETE FROM video_metadata WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_video_delete ON videos;
CREATE TRIGGER after_video_delete
  AFTER DELETE ON videos
  FOR EACH ROW
  EXECUTE PROCEDURE cleanup_after_video_delete();

-- 8. Zapewnij, że w tabeli videos będzie kolumna video_url
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'videos' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE videos ADD COLUMN video_url TEXT;
  END IF;
END $$; 