import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { GenerationResult, FlavourType } from '../types/photobooth';
import { Check, Info } from 'lucide-react';

interface ResultScreenProps {
  result: GenerationResult;
  flavour: FlavourType;
  onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  flavour,
  onRestart,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const idleTimeout = 90;
  const [timeLeft, setTimeLeft] = useState(idleTimeout);

  // Trigger celebratory confetti on entrance
  useEffect(() => {
    try {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#E50914', '#F59E0B', '#FDE047'],
      });
      fire(0.2, {
        spread: 60,
        colors: ['#FF4500', '#FFD700', '#FFA500'],
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ['#FFFFFF', '#F59E0B', '#E50914'],
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        colors: ['#E50914', '#FFB800'],
      });
    } catch (e) {
      // Ignore if canvas-confetti fails
    }
  }, []);

  // Idle reset countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      onRestart();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onRestart]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = result.imageUrl;
      a.download = `chicka-puffs-${flavour}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Photo downloaded successfully!');
    } catch (err) {
      console.error('[Download Failed]', err);
      showToast('Download started');
    }
  };

  const handleShare = async () => {
    try {
      // If Web Share API is available with file support
      if (navigator.share) {
        // Attempt converting image to File
        const res = await fetch(result.imageUrl);
        const blob = await res.blob();
        const file = new File([blob], `chicka-puffs-${flavour}.jpg`, { type: blob.type || 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Chicka Puffs Photobooth Creation!',
            text: 'Check out my custom Chicka Puffs snack artwork!',
            files: [file],
          });
          showToast('Shared successfully!');
          return;
        }

        // Fallback to sharing URL
        await navigator.share({
          title: 'My Chicka Puffs Photobooth Creation!',
          text: 'Check out my custom Chicka Puffs snack artwork!',
          url: window.location.href,
        });
        showToast('Shared successfully!');
        return;
      }

      // Fallback for desktop browsers without Web Share: download & copy link
      handleDownload();
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Photo downloaded & link copied to clipboard!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[Share fallback]', err);
        handleDownload();
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none flex items-center justify-center">
      {/* 9:16 Portrait Canvas Container */}
      <div className="relative w-full h-full max-w-[540px] max-h-[960px] aspect-[9/16] overflow-hidden flex flex-col justify-between bg-black">
        {/* Main Transformed Artwork in 9:16 */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-black">
          <img
            src={result.imageUrl}
            alt="Transformed Photobooth Result"
            className="w-full h-full object-cover animate-fadeIn"
          />

          {/* Top Banner with Variation Badge & Idle Timer */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
            <div className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-medium text-xs shadow-lg">
              ✨ {result.variationName}
            </div>

            <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/90 font-mono text-xs">
              ⏱️ {timeLeft}s
            </div>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-black/80 backdrop-blur-md border border-yellow-400 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl animate-scaleIn">
            <Check size={16} className="text-yellow-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Bottom Action Bar (Matches Result-Screen.png Exactly) */}
        <div className="relative z-20 w-full bg-black px-6 pt-3 pb-6 safe-pb-bar flex items-center justify-between gap-4 border-t border-white/10">
          {/* RESTART BUTTON */}
          <button
            onClick={onRestart}
            className="group flex-1 flex flex-col items-center justify-center bg-transparent border-none p-0 outline-none cursor-pointer focus:outline-none transition-transform duration-200 active:scale-95 hover:scale-105"
            style={{ background: 'transparent', border: 'none', padding: 0 }}
            aria-label="Restart photobooth"
          >
            <img
              src="/assets/result/Restart.png"
              alt="Restart"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] group-hover:brightness-110 transition-all pointer-events-none"
            />
            <span className="mt-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-yellow-400 font-['Montserrat']">
              RESTART
            </span>
          </button>

          {/* SHARE BUTTON */}
          <button
            onClick={handleShare}
            className="group flex-1 flex flex-col items-center justify-center bg-transparent border-none p-0 outline-none cursor-pointer focus:outline-none transition-transform duration-200 active:scale-95 hover:scale-105"
            style={{ background: 'transparent', border: 'none', padding: 0 }}
            aria-label="Share Photo"
          >
            <img
              src="/assets/result/Share-Btn.png"
              alt="Share"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_4px_12px_rgba(234,88,12,0.5)] group-hover:brightness-110 transition-all pointer-events-none"
            />
            <span className="mt-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-500 font-['Montserrat']">
              SHARE
            </span>
          </button>

          {/* DOWNLOAD BUTTON */}
          <button
            onClick={handleDownload}
            className="group flex-1 flex flex-col items-center justify-center bg-transparent border-none p-0 outline-none cursor-pointer focus:outline-none transition-transform duration-200 active:scale-95 hover:scale-105"
            style={{ background: 'transparent', border: 'none', padding: 0 }}
            aria-label="Download Photo"
          >
            <img
              src="/assets/result/Download.png"
              alt="Download"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] group-hover:brightness-110 transition-all pointer-events-none"
            />
            <span className="mt-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-yellow-400 font-['Montserrat']">
              DOWNLOAD
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
