/**
 * Formatuje URL dla plików z Supabase Storage
 * @param {string} url - Ścieżka do pliku
 * @param {string} bucket - Nazwa bucketa (domyślnie 'videos')
 * @returns {string} - Pełny URL do pliku
 */
export function formatStorageUrl(url, bucket = 'videos') {
  if (!url) {
    console.error('formatStorageUrl: URL is empty');
    return '';
  }

  try {
    // Jeśli URL już zawiera http lub https, zwróć go bez zmian
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Sprawdź poprawność nazwy pliku
    const fileName = url.split('/').pop();
    const hasValidExtension = /\.(mp4|webm|mov|ogg)$/i.test(fileName);
    
    // Jeśli plik nie ma rozszerzenia wideo, dodaj .mp4
    let processedUrl = url;
    if (!hasValidExtension) {
      console.warn('formatStorageUrl: Nazwa pliku nie zawiera rozszerzenia wideo, dodaję .mp4:', url);
      // Sprawdź czy nazwa pliku to "Download" (przypadek powodujący błąd)
      if (fileName === 'Download') {
        console.error('formatStorageUrl: Nieprawidłowa nazwa pliku "Download", to może być nieprawidłowy URL');
        return '';
      }
      processedUrl = `${url}.mp4`;
    }
    
    // Pobierz URL Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('formatStorageUrl: NEXT_PUBLIC_SUPABASE_URL is not defined');
      return processedUrl;
    }
    
    // Jeśli URL zawiera /storage/, to jest już względną ścieżką Supabase
    if (processedUrl.startsWith('/storage/')) {
      return `${supabaseUrl}${processedUrl}`;
    }
    
    // W przeciwnym razie załóż, że jest to sama nazwa pliku w buckecie
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${processedUrl}`;
  } catch (err) {
    console.error('formatStorageUrl: Error generating URL:', err);
    return url;
  }
} 