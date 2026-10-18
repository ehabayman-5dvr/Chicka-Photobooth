import React from 'react';
import { FlavourType } from '../types/photobooth';

interface StartScreenProps {
  onSelectFlavour: (flavour: FlavourType) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onSelectFlavour,
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-black flex flex-col justify-end">
      {/* Background Video Loop with Poster Fallback */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        autoPlay
        loop
        muted
        playsInline
        poster="/assets/start/Start-Screen.png"
      >
        <source src="/assets/start/Start_Screen_Loop.mp4" type="video/mp4" />
      </video>

      {/* Interactive Bottom Selection Buttons (aligned with reference design) */}
      <div className="relative z-10 w-full px-6 pb-12 pt-4 safe-pb-controls flex items-center justify-between gap-4 max-w-lg mx-auto">
        {/* Hot Ketchup Button */}
        <button
          onClick={() => onSelectFlavour('hot_ketchup')}
          className="group relative flex-1 bg-transparent border-none p-0 outline-none cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105 focus:outline-none"
          style={{ background: 'transparent', border: 'none', padding: 0 }}
          aria-label="Select Hot Ketchup Flavour"
        >
          <img
            src="/assets/start/Hot_Ketchup_Btn.png"
            alt="Hot Ketchup"
            className="w-full h-auto drop-shadow-[0_10px_20px_rgba(229,9,20,0.6)] group-hover:brightness-110 transition-all pointer-events-none"
          />
        </button>

        {/* Four Cheese Button */}
        <button
          onClick={() => onSelectFlavour('four_cheese')}
          className="group relative flex-1 bg-transparent border-none p-0 outline-none cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105 focus:outline-none"
          style={{ background: 'transparent', border: 'none', padding: 0 }}
          aria-label="Select Four Cheese Flavour"
        >
          <img
            src="/assets/start/Four_Cheese_Btn.png"
            alt="Four Cheese"
            className="w-full h-auto drop-shadow-[0_10px_20px_rgba(245,158,11,0.6)] group-hover:brightness-110 transition-all pointer-events-none"
          />
        </button>
      </div>
    </div>
  );
};
