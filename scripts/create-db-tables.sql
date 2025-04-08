-- Skrypt do utworzenia tabel w Supabase
-- Uruchom ten skrypt w SQL Editor w Supabase Studio

-- Tabela użytkowników
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  selected_topics TEXT[] DEFAULT '{}',
  liked_videos UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela filmów
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  category TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela fiszek
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  example TEXT,
  category TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Włączenie Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Polityki dostępu dla tabeli users
CREATE POLICY "Users can view all profiles" 
ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE USING (auth.uid() = id);

-- Polityki dostępu dla tabeli videos
CREATE POLICY "Anyone can view videos" 
ON videos FOR SELECT USING (true);

CREATE POLICY "Users can insert own videos" 
ON videos FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own videos" 
ON videos FOR UPDATE USING (auth.uid() = uploaded_by);

-- Polityki dostępu dla tabeli flashcards
CREATE POLICY "Anyone can view flashcards" 
ON flashcards FOR SELECT USING (true);

CREATE POLICY "Users can insert own flashcards" 
ON flashcards FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own flashcards" 
ON flashcards FOR UPDATE USING (auth.uid() = created_by);

-- Przykładowe dane (opcjonalnie)
INSERT INTO videos (title, video_url, category, likes) VALUES 
('Wprowadzenie do JavaScript', 'https://example.com/placeholder.mp4', 'JavaScript', 5),
('Jak używać Supabase', 'https://example.com/placeholder.mp4', 'Backend', 10),
('CSS Grid w 5 minut', 'https://example.com/placeholder.mp4', 'CSS', 8);

INSERT INTO flashcards (question, answer, example, category) VALUES 
('Co to jest SQL?', 'Structured Query Language - język zapytań do baz danych', 'SELECT * FROM users', 'Programowanie'),
('Co to jest React?', 'Biblioteka JavaScript do budowania interfejsów użytkownika', 'const App = () => <h1>Hello World</h1>', 'Frontend'),
('Co to jest API?', 'Application Programming Interface - zestaw reguł i protokołów do budowania i integracji oprogramowania', 'fetch("https://api.example.com/data")', 'Web Development'); 