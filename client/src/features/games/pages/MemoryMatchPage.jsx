import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Award, Clock, HelpCircle, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../../config/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useToastStore } from '../../../store/toastStore';

export default function MemoryMatchPage() {
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic') || 'General Web Development';
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]); // indices of currently selected cards
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const loadDeck = async () => {
    setLoading(true);
    setGameFinished(false);
    setMoves(0);
    setElapsedTime(0);
    setSelected([]);
    try {
      // Fetch 6 flashcards from AI to make a 12-card match game
      const res = await api.post('/ai/flashcards/generate', {
        topic,
        count: 6,
      });

      const flashcards = res.data.data.flashcards;
      
      if (!flashcards || flashcards.length === 0) {
        throw new Error('No flashcards returned');
      }

      // Create terms and definitions cards
      const termCards = flashcards.map((fc, index) => ({
        id: `term-${index}`,
        pairId: index,
        type: 'term',
        text: fc.front,
        isFlipped: false,
        isMatched: false,
      }));

      const defCards = flashcards.map((fc, index) => ({
        id: `def-${index}`,
        pairId: index,
        type: 'definition',
        text: fc.back,
        isFlipped: false,
        isMatched: false,
      }));

      // Merge and shuffle cards
      const merged = [...termCards, ...defCards];
      const shuffled = merged.sort(() => Math.random() - 0.5);

      setCards(shuffled);
      setStartTime(Date.now());
    } catch (err) {
      console.error(err);
      showToast('Failed to load memory match deck.', 'error');
      navigate('/games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeck();
  }, [topic]);

  // Timer effect
  useEffect(() => {
    if (loading || gameFinished || !startTime) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, gameFinished, startTime]);

  const handleCardClick = (idx) => {
    // Prevent clicking matched or already selected cards, or clicking when 2 cards are already open
    if (cards[idx].isMatched || cards[idx].isFlipped || selected.length >= 2) return;

    // Flip the clicked card
    const updatedCards = [...cards];
    updatedCards[idx].isFlipped = true;
    setCards(updatedCards);

    const newSelected = [...selected, idx];
    setSelected(newSelected);

    // Check match when two cards are selected
    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      const [firstIdx, secondIdx] = newSelected;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      // Match check: same pairId but different types (term vs definition)
      if (firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
        // MATCH!
        setTimeout(() => {
          setCards(prevCards => {
            const temp = [...prevCards];
            temp[firstIdx].isMatched = true;
            temp[secondIdx].isMatched = true;
            
            // Check if game is completed
            const allMatched = temp.every(c => c.isMatched);
            if (allMatched) {
              setGameFinished(true);
              showToast('Superb! You matched all concept definitions.', 'success');
            }
            return temp;
          });
          setSelected([]);
        }, 500);
      } else {
        // NO MATCH -> Flip them back after 1.2s
        setTimeout(() => {
          setCards(prevCards => {
            const temp = [...prevCards];
            temp[firstIdx].isFlipped = false;
            temp[secondIdx].isFlipped = false;
            return temp;
          });
          setSelected([]);
        }, 1200);
      }
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono font-bold text-black">Building Memory Decks...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-brutal-cream py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top bar navigation & stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button 
            onClick={() => navigate('/games')} 
            variant="secondary" 
            size="sm"
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          <div className="flex flex-wrap gap-3 font-mono text-xs font-black">
            <div className="bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 text-black">
              <Clock className="w-3.5 h-3.5" /> {formatTime(elapsedTime)}
            </div>
            <div className="bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
              MOVES: {moves}
            </div>
            <div className="bg-brutal-purple border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black uppercase">
              DECK: {topic}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!gameFinished ? (
            /* GAME BOARD */
            <motion.div 
              key="game-board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            >
              {cards.map((card, idx) => {
                const isOpen = card.isFlipped || card.isMatched;
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className="aspect-[4/3] sm:aspect-square relative cursor-pointer select-none group min-h-[120px] md:min-h-[140px]"
                  >
                    <div 
                      className={`absolute inset-0 rounded-xl border-[3px] border-black transition-all duration-300 transform-gpu preserve-3d shadow-brutal flex flex-col items-center justify-center p-3 text-center ${
                        isOpen 
                          ? 'rotate-y-180 bg-white' 
                          : 'bg-brutal-yellow hover:bg-yellow-300'
                      } ${card.isMatched ? 'border-brutal-green bg-green-50/20' : ''}`}
                    >
                      {isOpen ? (
                        <div className="flex flex-col justify-between h-full w-full">
                          <span className={`text-[8px] font-mono font-black border px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] self-start uppercase ${
                            card.type === 'term' ? 'bg-brutal-purple' : 'bg-brutal-pink'
                          }`}>
                            {card.type}
                          </span>
                          <p className="text-xs font-black text-black leading-tight flex-1 flex items-center justify-center overflow-y-auto px-1">
                            {card.text}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Gamepad2 className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-mono font-black text-black/75 uppercase tracking-wider">BrainForge</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            /* GAME COMPLETED SCREEN */
            <motion.div
              key="game-finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center"
            >
              <Card bg="#E9D5FF" className="p-8 space-y-6 border-3 border-black text-black">
                <span className="text-4xl">🏆</span>
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-wider">Memory Match Master!</h1>
                  <p className="text-xs font-bold text-black/70 mt-1">You matched all terms and definitions correctly</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
                    <p className="text-[9px] font-mono font-black text-black/50">TIME ELAPSED</p>
                    <p className="text-xl font-black text-black">{formatTime(elapsedTime)}</p>
                  </div>
                  <div className="bg-white border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
                    <p className="text-[9px] font-mono font-black text-black/50">TOTAL MOVES</p>
                    <p className="text-xl font-black text-black">{moves}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    onClick={loadDeck} 
                    bg="#FFE600" 
                    className="w-full py-3.5 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Play Again
                  </Button>
                  <Button 
                    onClick={() => navigate('/games')} 
                    variant="secondary" 
                    className="w-full py-3.5"
                  >
                    Back to Games Hub
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
