import React, { useEffect, useState } from 'react';
import { FlavourType } from '../types/photobooth';

interface RetakeScreenProps {
  capturedImage: string;
  flavour: FlavourType;
  onProceed: () => void;
  onRetake: () => void;
}

export const RetakeScreen: React.FC<RetakeScreenProps> = ({
  capturedImage,
  flavour,
  onProceed,
  onRetake,
}) => {
  const autoProceedDuration = 5;
  const [secondsRemaining, setSecondsRemaining] = useState(autoProceedDuration);

  // Auto-proceed countdown timer (mandatory kiosk queue flow)
  useEffect(() => {
    if (secondsRemaining <= 0) {
      onProceed();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, onProceed]);

  const frameImage =
    flavour === 'four_cheese'
      ? '/assets/retake/Four-Cheese.png'
      : '/assets/retake/Hot-Ketchup.png';

  const retakeButtonImage =
    flavour === 'four_cheese'
      ? '/assets/retake/Retake-Four-Cheese.png'
      : '/assets/retake/Retake-Hot-Ketchup.png';

  const accentColor = flavour === 'four_cheese' ? '#F59E0B' : '#E50914';

  const isFourCheese = flavour === 'four_cheese';
  const frameDimensions = isFourCheese
    ? { left: '21.39%', top: '14.37%', width: '57.87%', height: '58.44%' }
    : { left: '20.83%', top: '15.16%', width: '57.59%', height: '58.59%' };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none flex items-center justify-center">
      {/* Container strictly maintaining 9:16 aspect ratio */}
      <div className="relative w-full h-full max-w-[540px] max-h-[960px] aspect-[9/16] overflow-hidden flex items-center justify-center">
        {/* Captured Photo positioned precisely inside the inner transparent window frame */}
        <div
          onClick={onProceed}
          title="Tap photo to proceed immediately"
          className="absolute z-10 cursor-pointer overflow-hidden rounded-[20px] sm:rounded-[26px] shadow-2xl transition-transform active:scale-[0.99]"
          style={frameDimensions}
        >
          <img
            src={capturedImage}
            alt="Captured Participant"
            className="w-full h-full object-cover"
          />
          {/* Subtle glossy overlay on photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" />
        </div>

        {/* Themed Photobooth Frame Overlay with Transparent Cutout (Four-Cheese or Hot-Ketchup) */}
        <img
          src={frameImage}
          alt={`${flavour} Frame`}
          className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
        />

        {/* Dynamic Countdown Indicator Bar (Sits over static text area without blocking photo) */}
        <div
          className="absolute z-30 flex flex-col items-center justify-center pointer-events-none"
          style={{
            top: '78.2%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '85%',
          }}
        >
          <div className="bg-black/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-2 shadow-2xl">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${isFourCheese ? 'bg-amber-400' : 'bg-red-500'} animate-ping`}
            />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white font-['Montserrat']">
              Auto-proceed in{' '}
              <span
                className={`font-mono text-sm sm:text-base font-black ${isFourCheese ? 'text-yellow-400' : 'text-red-400'}`}
              >
                {secondsRemaining}s
              </span>
            </span>
          </div>
        </div>

        {/* Bottom Interactive Retake Button (Compact, perfectly proportioned, zero overflow) */}
        <div
          className="absolute z-30 flex items-center justify-center pointer-events-auto"
          style={{
            top: '88.5%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
          }}
        >
          <button
            onClick={onRetake}
            className="group relative bg-transparent border-none p-0 outline-none cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105 focus:outline-none flex items-center justify-center"
            style={{
              width: '42%',
              maxWidth: '175px',
              minWidth: '135px',
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
            aria-label="Retake Photo"
          >
            <img
              src={retakeButtonImage}
              alt="Retake Photo"
              className="w-full h-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:brightness-110 transition-all pointer-events-none"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
