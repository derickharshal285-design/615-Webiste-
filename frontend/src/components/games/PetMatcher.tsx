import { useState, useEffect } from 'react';
import { Cat, Dog, Bird, Snail, Bug, Rabbit, Turtle, Fish, HelpCircle } from 'lucide-react';

const ICONS = [Cat, Dog, Bird, Snail, Bug, Rabbit, Turtle, Fish];

export default function PetMatcher({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [cards, setCards] = useState<{id: number, icon: any, isFlipped: boolean, isMatched: boolean}[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);

  const startGame = () => {
    // Duplicate icons to make pairs
    const deck = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5).map((icon, idx) => ({
      id: idx,
      icon,
      isFlipped: false,
      isMatched: false
    }));
    
    setCards(deck);
    setFlippedIndices([]);
    setScore(0);
    setMoves(0);
    setTime(60); // 60 seconds to complete
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleDefeat();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleDefeat = () => {
    setIsPlaying(false);
    onGameOver(score);
  };

  const handleCardClick = (index: number) => {
    if (!isPlaying) return;
    if (flippedIndices.length === 2) return; // Wait for animation
    if (cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstIndex, secondIndex] = newFlipped;
      if (cards[firstIndex].icon === cards[secondIndex].icon) {
        // Match!
        setTimeout(() => {
          setCards(prev => {
            const matched = [...prev];
            matched[firstIndex].isMatched = true;
            matched[secondIndex].isMatched = true;
            // Check win: all matched
            const totalMatched = matched.filter(c => c.isMatched).length;
            if (totalMatched === matched.length) {
              const bonus = time * 15;
              const finalScore = score + 200 + bonus;
              setScore(finalScore);
              setIsPlaying(false);
              onGameOver(finalScore);
            }
            return matched;
          });
          setFlippedIndices([]);
          setScore(s => s + 200);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => {
            const reset = [...prev];
            reset[firstIndex].isFlipped = false;
            reset[secondIndex].isFlipped = false;
            return reset;
          });
          setFlippedIndices([]);
          setScore(s => Math.max(0, s - 10)); // Penalty for wrong guess
        }, 1000);
      }
    }
  };

  const handleWin = () => {
    setIsPlaying(false);
    const timeBonus = time * 15;
    const finalScore = score + 200 + timeBonus;
    setScore(finalScore);
    onGameOver(finalScore);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 scale-110 md:scale-125 lg:scale-150 origin-center">
      <div className="mb-8 w-full max-w-md flex justify-between items-end border-b border-[#ff007f]/30 pb-4">
        <div>
          <div className="text-[#ff007f] text-xl font-black uppercase tracking-widest text-pop">Pet Matcher</div>
          <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Find all pairs</div>
        </div>
        <div className="text-right flex gap-4">
          <div>
            <div className="text-[9px] uppercase text-zinc-600 font-bold">Time</div>
            <div className="text-white font-sans">{time}s</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-zinc-600 font-bold">Moves</div>
            <div className="text-white font-sans">{moves}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-zinc-600 font-bold">Score</div>
            <div className="text-[#ff007f] font-sans font-bold">{score}</div>
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-md aspect-square">
        {!isPlaying && cards.length === 0 ? (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center border border-white/10">
            <button 
              onClick={startGame}
              className="bg-[#ff007f] text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-[#ff007f]/80 shadow-[0_0_20px_rgba(255,0,127,0.4)]"
            >
              Start Game
            </button>
          </div>
        ) : !isPlaying && cards.length > 0 ? (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-10 border border-white/10 backdrop-blur-sm">
            <div className="text-[#3dbca1] font-black mb-1 uppercase text-2xl tracking-widest">ALL MATCHED!</div>
            <div className="text-zinc-400 text-sm mb-4">Score: {score}</div>
            <button 
              onClick={startGame}
              className="bg-[#ff007f] text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-[#ff007f]/80"
            >
              Play Again
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2 sm:gap-4 h-full">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`relative w-full h-full rounded-lg transition-all duration-300 transform-gpu preserve-3d ${
                  card.isFlipped || card.isMatched ? 'rotate-y-180' : 'hover:scale-105'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Back of card */}
                <div 
                  className="absolute inset-0 backface-hidden bg-zinc-900 border-2 border-white/10 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <HelpCircle className="w-8 h-8 text-zinc-700" />
                </div>
                
                {/* Front of card */}
                <div 
                  className={`absolute inset-0 backface-hidden bg-black border-2 rounded-lg flex items-center justify-center rotate-y-180 shadow-[0_0_15px_rgba(255,0,127,0.2)] ${
                    card.isMatched ? 'border-[#3dbca1] shadow-[0_0_20px_rgba(61,188,161,0.4)] opacity-50' : 'border-[#ff007f]'
                  }`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <Icon className={`w-10 h-10 ${card.isMatched ? 'text-[#3dbca1]' : 'text-[#ff007f]'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
