# Interaktywne Filmy z Checkpointami

## Opis funkcjonalności

Funkcjonalność "Interaktywne filmy z checkpointami" pozwala na bardziej angażującą naukę poprzez zatrzymywanie filmu w określonych momentach (co 15 minut) i wyświetlanie pytań sprawdzających wiedzę. Użytkownik musi odpowiedzieć na pytanie, aby kontynuować oglądanie.

## Elementy funkcjonalności

1. **Interaktywny odtwarzacz wideo** - zatrzymuje odtwarzanie w określonych momentach i wyświetla pytania
2. **Pytania kontrolne** - sprawdzają zrozumienie materiału przez użytkownika
3. **Automatyczne checkpointy** - jeśli nie zdefiniowano checkpointów w bazie danych, generowane są automatycznie co 15 minut

## Konfiguracja

### 1. Utworzenie tabeli w bazie danych

Aby skorzystać z pełnej funkcjonalności, należy utworzyć tabelę `video_checkpoints` w bazie Supabase. Skrypt SQL do utworzenia tabeli znajduje się w pliku `supabase/schema/video_checkpoints.sql`.

Można go uruchomić bezpośrednio w panelu SQL Supabase:

1. Zaloguj się do panelu Supabase
2. Przejdź do zakładki SQL
3. Utwórz nowy zapytanie i wklej zawartość pliku
4. Uruchom zapytanie

### 2. Dodawanie checkpointów do filmów

Checkpointy można dodać ręcznie do bazy danych:

```sql
INSERT INTO video_checkpoints (video_id, time_in_seconds, question, options, correct_answer)
VALUES 
  ('ID_FILMU', 900, 'Jakie jest główne zagadnienie omawiane w tym segmencie?', 
   '["Architektura mikroserwisów", "Programowanie obiektowe", "Systemy rozproszone", "Integracja ciągła"]', 0);
```

gdzie:
- `ID_FILMU` - ID filmu w tabeli videos
- `time_in_seconds` - czas w sekundach, kiedy ma się pojawić checkpoint (900 = 15 minut)
- `question` - pytanie do wyświetlenia
- `options` - tablica JSON z opcjami odpowiedzi
- `correct_answer` - indeks poprawnej odpowiedzi (0 = pierwsza odpowiedź)

## Korzystanie z funkcjonalności

### Jako użytkownik

1. Zaloguj się do aplikacji
2. Wybierz opcję "Interaktywne" z menu nawigacyjnego
3. Wybierz film do oglądania
4. Film będzie się zatrzymywał co 15 minut, aby wyświetlić pytanie
5. Odpowiedz na pytanie, aby kontynuować oglądanie

### Jako administrator

1. Dodaj checkpointy dla filmów w bazie danych
2. Jeśli nie dodasz własnych checkpointów, system automatycznie wygeneruje checkpointy co 15 minut

## Rozwiązywanie problemów

1. **Film nie zatrzymuje się w spodziewanych miejscach**
   - Sprawdź, czy dodano checkpointy dla tego filmu w bazie danych
   - Sprawdź, czy czas w sekundach jest prawidłowy

2. **Błędy logowania w konsoli przeglądarki**
   - Sprawdź, czy tabela `video_checkpoints` została poprawnie utworzona
   - Upewnij się, że format danych w kolumnie `options` jest poprawnym JSON-em

## Rozwijanie funkcjonalności

Funkcjonalność można rozwijać o:

1. Panel administracyjny do zarządzania checkpointami
2. Statystyki odpowiedzi użytkowników
3. Personalizacja częstotliwości checkpointów
4. Różne typy pytań (nie tylko wielokrotnego wyboru)

## Zależności

Funkcjonalność korzysta z:

- React Hooks
- Supabase dla przechowywania danych
- Biblioteka video.js (pośrednio) 