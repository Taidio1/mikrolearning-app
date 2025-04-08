# Konfiguracja Supabase dla MicroLearn

Ten dokument zawiera instrukcje dotyczące konfiguracji Supabase dla aplikacji MicroLearn.

## Krok 1: Utworzenie projektu Supabase

1. Przejdź na stronę [Supabase](https://supabase.com/) i zaloguj się lub utwórz konto.
2. Kliknij "New Project".
3. Wprowadź nazwę projektu (np. "MicroLearn").
4. Ustaw silne hasło do bazy danych.
5. Wybierz region najbliższy twoim użytkownikom (np. dla Polski - Frankfurt).
6. Kliknij "Create new project".

## Krok 2: Konfiguracja autentykacji

1. W panelu Supabase przejdź do zakładki "Authentication" -> "Providers".
2. W sekcji "Email" upewnij się, że opcja "Enable Email Sign Up" jest włączona.
3. Możesz również włączyć inne metody logowania (np. Google, GitHub) jeśli chcesz.
4. Zapisz zmiany.

## Krok 3: Utworzenie tabel w bazie danych

1. W panelu Supabase przejdź do zakładki "SQL Editor".
2. Otwórz nowy zapytanie SQL.
3. Skopiuj i wklej zawartość pliku `scripts/create-db-tables.sql` z tego repozytorium.
4. Kliknij "Run" aby wykonać zapytanie i utworzyć tabele.

## Krok 4: Konfiguracja Storage dla plików wideo

1. W panelu Supabase przejdź do zakładki "Storage".
2. Kliknij "Create new bucket".
3. Nazwij bucket "videos".
4. Ustaw uprawnienia dostępu według potrzeb:
   - Dla publicznych filmów: Public bucket (read access for everyone).
   - Dla prywatnych filmów: Private bucket (authenticated access only).

## Krok 5: Uzyskanie danych uwierzytelniających

1. W panelu Supabase przejdź do "Project Settings" -> "API".
2. Skopiuj wartości:
   - "Project URL" - to będzie `NEXT_PUBLIC_SUPABASE_URL`.
   - "anon/public" key - to będzie `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Krok 6: Konfiguracja aplikacji

1. W katalogu głównym aplikacji, skopiuj plik `.env.local.example` do `.env.local`.
2. Uzupełnij wartości:
```
NEXT_PUBLIC_SUPABASE_URL=twój_skopiowany_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=twój_skopiowany_klucz
```

3. Uruchom aplikację poleceniem `npm run dev`.

## Rozwiązywanie problemów

### Problem z rejestracją użytkowników
Jeśli rejestracja użytkowników nie działa, upewnij się, że:
1. Email Confirmations są wyłączone (dla prostoty) lub poprawnie skonfigurowane.
2. W Supabase, w zakładce Authentication -> Settings, sprawdź czy "Confirm email domains" jest poprawnie skonfigurowane.

### Problem z pobieraniem danych
Jeśli masz problemy z pobieraniem danych, sprawdź:
1. Czy Row Level Security (RLS) jest poprawnie skonfigurowane.
2. Czy użytkownik ma odpowiednie uprawnienia do wykonywania operacji na tabelach.
3. Czy zapytania SQL są poprawnie sformułowane w kodzie aplikacji. 