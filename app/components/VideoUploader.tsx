'use client';

import { useState, useRef } from 'react';
import { FiUpload, FiCheck, FiX } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import supabase from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface VideoUploaderProps {
  onSuccess?: () => void;
  showAsButton?: boolean;
}

// Dostępne kategorie
const CATEGORIES = [
  'Programming',
  'Math',
  'Science',
  'Languages',
  'Design',
  'Other'
];

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  onSuccess,
  showAsButton = true 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [filename, setFilename] = useState<string>('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sprawdzenie czy plik jest wideo
    if (!file.type.startsWith('video/')) {
      setError('Wybierz plik wideo (mp4, webm, mov)');
      return;
    }

    // Sprawdzenie rozmiaru pliku (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('Plik jest za duży. Maksymalny rozmiar to 100MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    // Automatycznie proponowany tytuł bazujący na nazwie pliku
    const suggestedTitle = file.name
      .replace(/\.[^/.]+$/, "")  // Usuń rozszerzenie
      .replace(/_/g, " ")       // Zamień podkreślniki na spacje
      .replace(/-/g, " ");      // Zamień myślniki na spacje
    
    setTitle(suggestedTitle);
    setShowPopup(true);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setSelectedFile(null);
    setTitle('');
    setCategory(CATEGORIES[0]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !title.trim()) {
      setError('Tytuł jest wymagany');
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);
    setShowPopup(false);
    
    // Generowanie bezpiecznej nazwy pliku
    const fileExt = selectedFile.name.split('.').pop();
    const safeFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    setFilename(selectedFile.name);

    try {
      // Przesyłanie pliku do bucketa Supabase
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(safeFileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Po pomyślnym przesłaniu, dodajemy wpis do tabeli videos
      const { error: dbError } = await supabase
        .from('videos')
        .insert([
          {
            title: title.trim(),
            video_url: safeFileName,
            category: category,
            likes: 0,
            uploaded_by: user?.id
          }
        ]);

      if (dbError) throw dbError;

      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // Reset formularza po 2 sekundach
      setTimeout(() => {
        setSuccess(false);
        setFilename('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Błąd podczas wgrywania pliku');
    } finally {
      setIsUploading(false);
    }
  };

  // Renderowanie popupu
  const renderPopup = () => {
    if (!showPopup) return null;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/75 z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
          <h3 className="text-white text-xl font-semibold mb-4">Dodaj nowe wideo</h3>
          
          <form onSubmit={handleUpload}>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Tytuł
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Wprowadź tytuł filmu"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Kategoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="text-sm text-gray-400 mb-4">
              <p>Plik: <span className="text-gray-300">{selectedFile?.name}</span></p>
              <p>Rozmiar: <span className="text-gray-300">{(selectedFile?.size || 0) / (1024 * 1024) < 1 
                ? `${Math.round((selectedFile?.size || 0) / 1024)} KB` 
                : `${((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB`}</span>
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handlePopupClose}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Wgraj wideo
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Renderowanie jako przycisk lub pełny interfejs
  if (showAsButton) {
    return (
      <div>
        <input
          type="file"
          accept="video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleFileSelect}
          disabled={isUploading}
          className={`flex items-center justify-center rounded-full p-3 ${
            isUploading ? 'bg-gray-500' : success ? 'bg-green-500' : 'bg-primary'
          } text-white shadow-lg hover:opacity-90 transition-all`}
          aria-label="Wgraj wideo"
        >
          {isUploading ? (
            <FaSpinner className="animate-spin" size={20} />
          ) : success ? (
            <FiCheck size={20} />
          ) : (
            <FiUpload size={20} />
          )}
        </button>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        {renderPopup()}
      </div>
    );
  }

  // Pełny interfejs uploadu
  return (
    <div className="p-4 bg-gray-800 rounded-lg w-full max-w-md">
      <h3 className="text-white text-lg font-semibold mb-4">Wgraj nowe wideo</h3>
      
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div
        onClick={handleFileSelect}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer 
          ${isUploading ? 'border-gray-400 bg-gray-700' : 
            error ? 'border-red-400 bg-red-900/20' : 
            success ? 'border-green-400 bg-green-900/20' : 
            'border-primary/70 hover:border-primary hover:bg-primary/10'}`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin text-2xl text-gray-300 mb-2" />
            <p className="text-gray-300">Wgrywanie {progress}%</p>
            <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400 mt-2 truncate">{filename}</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center text-green-400">
            <FiCheck className="text-3xl mb-2" />
            <p>Wideo zostało wgrane pomyślnie!</p>
            <p className="text-sm text-green-300 mt-1 truncate">{title}</p>
          </div>
        ) : (
          <div className="text-gray-300">
            <FiUpload className="text-3xl mx-auto mb-2" />
            <p>Kliknij lub przeciągnij plik wideo tutaj</p>
            <p className="text-sm mt-1 text-gray-400">(maksymalnie 100MB)</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-red-400 flex items-center">
          <FiX className="mr-1" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {renderPopup()}
    </div>
  );
};

export default VideoUploader; 