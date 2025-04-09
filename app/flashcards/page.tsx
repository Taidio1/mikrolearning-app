'use client';

import { useState, useEffect, useRef } from 'react';
import supabase from '../../lib/supabase';
import ExpandableFlashcard from '../components/ExpandableFlashcard';
import { useAuth } from '../contexts/AuthContext';
import { FaCheckCircle, FaFilter, FaRandom } from 'react-icons/fa';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  example: string;
  category: string;
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [learnedFlashcards, setLearnedFlashcards] = useState<string[]>([]);
  const [showLearned, setShowLearned] = useState(false);
  const { user } = useAuth();
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const filterPopupRef = useRef<HTMLDivElement>(null);
  
  // Liczba kart na stronie
  const CARDS_PER_PAGE = 4;

  // Pobranie fiszek i listy "już umiem"
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // Pobierz fiszki
        let query = supabase.from('flashcards').select('*');
        
        if (selectedCategory) {
          query = query.eq('category', selectedCategory);
        }
        
        const { data: flashcardsData, error: flashcardsError } = await query;
        
        if (flashcardsError) {
          console.error('Error fetching flashcards:', flashcardsError);
          return;
        }
        
        if (flashcardsData) {
          setFlashcards(flashcardsData as Flashcard[]);
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(flashcardsData.map((card: any) => card.category))
          );
          setCategories(uniqueCategories as string[]);
          // Ustaw domyślnie wszystkie kategorie jako wybrane
          setSelectedCategories(uniqueCategories as string[]);
        }
        
        // Najpierw sprawdź localStorage na wypadek problemów z DB
        const localLearnedFlashcards = localStorage.getItem('learned_flashcards');
        if (localLearnedFlashcards) {
          setLearnedFlashcards(JSON.parse(localLearnedFlashcards));
        }
        
        // Pobierz listę nauczonych fiszek z DB jeśli użytkownik jest zalogowany
        if (user) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('learned_flashcards')
              .eq('id', user.id)
              .single();
            
            if (!userError && userData && userData.learned_flashcards) {
              setLearnedFlashcards(userData.learned_flashcards);
              // Synchronizuj localStorage z bazą danych
              localStorage.setItem('learned_flashcards', JSON.stringify(userData.learned_flashcards));
            }
          } catch (error) {
            console.error('Error fetching learned flashcards:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [selectedCategory, user]);

  // Obsługa kliknięcia poza popupem
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setShowFilterPopup(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Funkcja oznaczająca fiszkę jako nauczoną
  const handleMarkAsLearned = async (flashcardId: string) => {
    try {
      // Aktualizuj lokalny stan
      let updatedLearnedFlashcards;
      
      // Sprawdź czy fiszka już jest na liście nauczonych
      const isAlreadyLearned = learnedFlashcards.includes(flashcardId);
      
      if (isAlreadyLearned) {
        // Usuń z listy jeśli już istnieje
        updatedLearnedFlashcards = learnedFlashcards.filter(id => id !== flashcardId);
      } else {
        // Dodaj do listy jeśli nie istnieje
        updatedLearnedFlashcards = [...learnedFlashcards, flashcardId];
      }
      
      // Aktualizuj stan lokalny
      setLearnedFlashcards(updatedLearnedFlashcards);
      
      // Zawsze zapisz w localStorage jako zabezpieczenie
      localStorage.setItem('learned_flashcards', JSON.stringify(updatedLearnedFlashcards));
      
      // Pokazuj komunikat o dodaniu/usunięciu (opcjonalnie)
      // W trybie "Pokaż nauczone" karty nie powinny znikać natychmiast
      if (showLearned && isAlreadyLearned) {
        // Opóźnij odświeżenie widoku, aby użytkownik mógł zobaczyć animację
        setTimeout(() => {
          // Sprawdź, czy wszystkie karty zostały usunięte z widoku
          if (visibleFlashcards.length === 1) {
            // Jeśli to ostatnia karta, przełącz widok na wszystkie
            setShowLearned(false);
          }
        }, 500);
      }
      
      // Aktualizuj bazę danych jeśli użytkownik jest zalogowany
      if (user) {
        // Najpierw spróbuj prostego UPDATE
        const { error: updateError } = await supabase
          .from('users')
          .update({ learned_flashcards: updatedLearnedFlashcards })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating learned flashcards:', updateError);
          
          // Jeśli update się nie powiedzie, spróbuj INSERT
          if (updateError.message?.includes('not found')) {
            const { error: insertError } = await supabase
              .from('users')
              .insert([{
                id: user.id,
                email: user.email,
                learned_flashcards: updatedLearnedFlashcards
              }]);
              
            if (insertError) {
              console.error('Error inserting learned flashcards:', insertError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error marking flashcard as learned:', error);
    }
  };

  const handleNext = () => {
    const maxPage = Math.ceil(getVisibleFlashcards().length / CARDS_PER_PAGE) - 1;
    if (currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    } else {
      // Loop back to the beginning
      setCurrentPage(0);
    }
  };

  const handlePrevious = () => {
    const maxPage = Math.ceil(getVisibleFlashcards().length / CARDS_PER_PAGE) - 1;
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      // Loop to the end
      setCurrentPage(maxPage);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    // Resetujemy filtr kategorii z checkboxów podczas używania starego systemu
    setSelectedCategories([]);
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  const shuffleCards = () => {
    // Filtrowanie kart według wybranych kategorii przed tasowaniem
    let cardsToShuffle = [...flashcards];
    
    if (selectedCategories.length > 0) {
      cardsToShuffle = cardsToShuffle.filter(card => 
        selectedCategories.includes(card.category)
      );
    }
    
    const shuffled = cardsToShuffle.sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentPage(0);
    setShowFilterPopup(false);
  };

  const handleCategoryCheckbox = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...categories]);
    }
  };

  // Filtrowanie fiszek na podstawie stanu "już umiem"
  const getVisibleFlashcards = () => {
    let filteredCards = [...flashcards];
    
    // Filtrowanie po kategoriach jeśli są wybrane
    if (selectedCategories.length > 0) {
      filteredCards = filteredCards.filter(card => 
        selectedCategories.includes(card.category)
      );
    } 
    // Jeśli jest wybrana pojedyncza kategoria (stary system filtrowania)
    else if (selectedCategory) {
      filteredCards = filteredCards.filter(card => 
        card.category === selectedCategory
      );
    }
    
    // Filtrowanie po stanie "nauczonych"
    if (showLearned) {
      // Pokaż tylko nauczone fiszki
      return filteredCards.filter(card => learnedFlashcards.includes(card.id));
    } else {
      // Pokaż wszystkie po filtrach
      return filteredCards;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl">Ładowanie fiszek...</p>
      </div>
    );
  }

  const visibleFlashcards = getVisibleFlashcards();

  if (visibleFlashcards.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <h2 className="text-2xl mb-4">Brak dostępnych fiszek</h2>
        {showLearned && (
          <p className="text-center mb-4">Nie masz jeszcze żadnych fiszek oznaczonych jako nauczone.</p>
        )}
        <div className="flex gap-2">
          {selectedCategory && (
            <button 
              onClick={() => handleCategorySelect(null)}
              className="py-2 px-4 bg-blue-600 text-white rounded-md"
            >
              Pokaż wszystkie fiszki
            </button>
          )}
          <button 
            onClick={() => setShowLearned(!showLearned)}
            className="py-2 px-4 bg-purple-600 text-white rounded-md"
          >
            {showLearned ? 'Pokaż wszystkie' : 'Pokaż nauczone'}
          </button>
        </div>
      </div>
    );
  }

  // Oblicz zakres kart do wyświetlenia na aktualnej stronie
  const startIndex = currentPage * CARDS_PER_PAGE;
  const endIndex = Math.min(startIndex + CARDS_PER_PAGE, visibleFlashcards.length);
  const currentPageCards = visibleFlashcards.slice(startIndex, endIndex);
  
  // Oblicz całkowitą liczbę stron
  const totalPages = Math.ceil(visibleFlashcards.length / CARDS_PER_PAGE);

  // Liczba nauczonych fiszek
  const learnedCount = flashcards.filter(card => learnedFlashcards.includes(card.id)).length;

  return (
    <div className="flex flex-col min-h-screen pb-20 p-4">
      {/* Top controls */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="relative">
          <button 
            onClick={() => setShowFilterPopup(!showFilterPopup)}
            className="py-2 px-4 bg-blue-600 text-white rounded-md flex items-center"
          >
            <FaFilter className="mr-2" />
            Filtry i losowanie
          </button>
          
          {showFilterPopup && (
            <div 
              ref={filterPopupRef}
              className="absolute z-10 mt-2 w-64 bg-white shadow-lg rounded-md p-4 border border-gray-200"
            >
              <h3 className="text-lg font-medium mb-3 text-blue-700">Filtry kategorii</h3>
              
              {/* Checkbox dla wszystkich kategorii */}
              <div className="mb-3">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.length === categories.length}
                    onChange={handleSelectAllCategories}
                    className="mr-2 h-4 w-4" 
                  />
                  <span className="font-medium text-blue-600">Wszystkie kategorie</span>
                </label>
              </div>
              
              <div className="max-h-60 overflow-y-auto mb-4">
                {categories.map(category => (
                  <div key={category} className="mb-2">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryCheckbox(category)}
                        className="mr-2 h-4 w-4" 
                      />
                      <span className="text-blue-500">{category}</span>
                    </label>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={shuffleCards}
                className="w-full py-2 bg-blue-600 text-white rounded-md flex items-center justify-center"
              >
                <FaRandom className="mr-2" />
                Losuj fiszki
              </button>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setShowLearned(!showLearned)}
          className={`py-2 px-4 rounded-md flex items-center ${
            showLearned ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'
          }`}
        >
          <FaCheckCircle className="mr-2" />
          {showLearned ? 'Pokaż wszystkie' : 'Pokaż nauczone'}
        </button>
      </div>
      
      {/* Stats */}
      <div className="flex justify-between mb-4 text-sm text-gray-600">
        <div>
          Wszystkich: {visibleFlashcards.length}/{flashcards.length}
          {selectedCategories.length > 0 && ` (filtrowane)`}
        </div>
        <div className="flex items-center">
          <FaCheckCircle className="mr-1 text-green-500" />
          Nauczonych: {learnedCount} ({Math.round((learnedCount / flashcards.length) * 100) || 0}%)
        </div>
      </div>
      
      {/* Informacja o aktywnych filtrach */}
      {selectedCategories.length > 0 && selectedCategories.length < categories.length && (
        <div className="mb-4 p-2 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            Aktywne filtry: {selectedCategories.join(', ')}
          </p>
        </div>
      )}
      
      {/* Flashcards container */}
      <div className="flex-1">
        {currentPageCards.map((card) => (
          <ExpandableFlashcard
            key={card.id}
            id={card.id}
            question={card.question}
            answer={card.answer}
            example={card.example}
            category={card.category}
            onMarkAsLearned={handleMarkAsLearned}
            isLearned={learnedFlashcards.includes(card.id)}
          />
        ))}
        
        {/* Jeśli na stronie jest mniej niż CARDS_PER_PAGE kart, dodaj puste miejsca */}
        {currentPageCards.length < CARDS_PER_PAGE && (
          <div className="py-4 text-center text-gray-500">
            Koniec zestawu fiszek
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6 mb-4">
        <button
          onClick={handlePrevious}
          className="py-2 px-6 bg-gray-200 rounded-md"
        >
          Poprzednia
        </button>
        {/* Page counter */}
        <div className="text-left flex items-center">
          Strona {currentPage + 1} / {totalPages}
        </div>
        <button
          onClick={handleNext}
          className="py-2 px-6 bg-blue-600 text-white rounded-md"
        >
          Następna
        </button>
      </div>
    </div>
  );
} 