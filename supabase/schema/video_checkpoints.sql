-- Tabela przechowująca checkpointy dla filmów interaktywnych
CREATE TABLE IF NOT EXISTS video_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  time_in_seconds FLOAT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Tablica opcji odpowiedzi
  correct_answer INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Upewnij się, że czas checkpointu jest zawsze dodatni
  CONSTRAINT positive_time CHECK (time_in_seconds >= 0)
);

-- Indeks na video_id dla szybszego wyszukiwania checkpointów dla konkretnego filmu
CREATE INDEX IF NOT EXISTS video_checkpoints_video_id_idx ON video_checkpoints(video_id);

-- Komentarz do tabeli
COMMENT ON TABLE video_checkpoints IS 'Przechowuje checkpointy dla filmów interaktywnych, gdzie użytkownik musi odpowiedzieć na pytanie';

-- Przykładowe dane (opcjonalnie)
-- INSERT INTO video_checkpoints (video_id, time_in_seconds, question, options, correct_answer)
-- VALUES 
--   ((SELECT id FROM videos LIMIT 1), 900, 'Jakie jest główne zagadnienie omawiane w tym segmencie?', 
--    '["Architektura mikroserwisów", "Programowanie obiektowe", "Systemy rozproszone", "Integracja ciągła"]', 0); 