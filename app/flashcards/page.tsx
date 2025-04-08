'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import ExpandableFlashcard from '../components/ExpandableFlashcard';
import { useAuth } from '../contexts/AuthContext';
import { FaCheckCircle } from 'react-icons/fa';

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
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentPage(0);
  };

  // Filtrowanie fiszek na podstawie stanu "już umiem"
  const getVisibleFlashcards = () => {
    if (showLearned) {
      // Pokaż tylko nauczone fiszki
      return flashcards.filter(card => learnedFlashcards.includes(card.id));
    } else {
      // Pokaż wszystkie lub filtruj te, które nie są nauczone
      return flashcards;
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
        <button 
          onClick={shuffleCards}
          className="py-2 px-4 bg-blue-600 text-white rounded-md"
        >
          Losuj fiszki
        </button>
        
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
        <div>Wszystkich: {flashcards.length}</div>
        <div className="flex items-center">
          <FaCheckCircle className="mr-1 text-green-500" />
          Nauczonych: {learnedCount} ({Math.round((learnedCount / flashcards.length) * 100) || 0}%)
        </div>
      </div>
      
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
      
      {/* Category selector */}
      <div className="mb-4 overflow-x-auto whitespace-nowrap pb-4 scrollbar-hide">
        <h3 className="text-sm font-medium mb-2 text-center">Kategorie:</h3>
        <div className="flex flex-wrap justify-center gap-2">
          <button 
            className={`px-3 py-1 rounded-full text-sm ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => handleCategorySelect(null)}
          >
            Wszystkie
          </button>
          
          {categories.map((category) => (
            <button 
              key={category}
              className={`px-3 py-1 rounded-full text-sm ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => handleCategorySelect(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 