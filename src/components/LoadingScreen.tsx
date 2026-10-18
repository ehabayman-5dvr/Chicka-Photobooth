import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { FlavourType, GenerationResult } from '../types/photobooth';
import { generatePhotoboothImage } from '../services/aiService';
import { playSuccessChime } from '../utils/audioService';

interface LoadingScreenProps {
  capturedImage: string;
  flavour: FlavourType;
  onSuccess: (result: GenerationResult) => void;
  onCancel: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  capturedImage,
  flavour,
  onSuccess,
  onCancel,
}) => {
  const [milestone, setMilestone] = useState('Synthesizing custom attire & environment...');
  const [percent, setPercent] = useState(25);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const hasStartedRef = useRef(false);

  const startPipeline = async () => {
    try {
      setError(null);
      setMilestone('Synthesizing custom attire & environment...');
      setPercent(25);

      // Initiate AI image generation directly (lightweight & fast for mobile)
      const result = await generatePhotoboothImage({
        base64Image: capturedImage,
        flavour,
        onProgress: (msg, pct) => {
          setMilestone(msg);
          setPercent(pct);
        },
      });

      setPercent(100);
      setMilestone('Photo complete!');
      playSuccessChime();

      // Brief transition delay
      setTimeout(() => {
        onSuccess(result);
      }, 400);
    } catch (err: any) {
      console.error('[Synthesis Pipeline Failed]', err);
      setError(
        err.message ||
          'Failed to generate your photo. Please check your network connection or API settings.'
      );
    }
  };


  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startPipeline();
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    hasStartedRef.current = false;
    startPipeline().finally(() => setIsRetrying(false));
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none flex items-center justify-center">
      {/* Container maintaining 9:16 aspect ratio */}
      <div className="relative w-full h-full max-w-[540px] max-h-[960px] aspect-[9/16] overflow-hidden flex flex-col items-center justify-between">
        {/* Background Video Loop or Poster Fallback */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          autoPlay
          loop
          muted
          playsInline
          poster="/assets/loading/Loading-Screen.png"
        >
          <source src="/assets/loading/Loading-Screen.mp4" type="video/mp4" />
        </video>

        {/* Top subtle branding indicator */}
        <div className="relative z-10 w-full pt-8 px-6 flex justify-between items-center">
          <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-semibold text-xs tracking-wider uppercase">
            {flavour === 'hot_ketchup' ? '🔥 Hot Ketchup Edition' : '🧀 Four Cheese Edition'}
          </div>

          {error && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-white text-xs flex items-center gap-1 active:scale-95"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </div>

        {/* Center / Bottom Circular Progress & Status Messages (Positioned neatly below mascot) */}
        <div className="relative z-10 w-full px-6 pb-12 flex flex-col items-center text-center">
          {!error ? (
            <div className="flex flex-col items-center animate-fadeIn">
              {/* Circular Glowing Ring Spinner (Compact 56px, Matches Loading-Screen.png Reference) */}
              <div className="relative w-14 h-14 mb-3 flex items-center justify-center">
                {/* Background Static Track */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                </svg>

                {/* Rotating Glowing Gradient Progress Ring */}
                <svg
                  className="w-full h-full animate-spin"
                  viewBox="0 0 60 60"
                  style={{ transformOrigin: 'center center' }}
                >
                  <defs>
                    <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E50914" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#FDE047" />
                    </linearGradient>
                    <filter id="spinnerGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    stroke="url(#loadingGradient)"
                    strokeWidth="4"
                    strokeDasharray="150.8"
                    strokeDashoffset={150.8 - (150.8 * Math.max(percent, 30)) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    filter="url(#spinnerGlow)"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>

                {/* Percentage text in center (Stationary & Upright) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-black text-white font-mono drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    {Math.round(percent)}%
                  </span>
                </div>
              </div>

              {/* Title from Reference: "GENERATING YOUR PHOTO..." */}
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-['Montserrat']">
                GENERATING YOUR PHOTO...
              </h2>

              {/* Dynamic Subtitle Milestone */}
              <p className="mt-1 text-xs text-yellow-300 font-semibold tracking-wide drop-shadow max-w-xs transition-opacity duration-300">
                {milestone}
              </p>
            </div>
          ) : (
            /* Error Display with Recovery Controls */
            <div className="w-full max-w-sm p-6 rounded-2xl bg-black/85 border border-red-500/80 backdrop-blur-lg flex flex-col items-center text-center shadow-2xl animate-shake">
              <div className="w-14 h-14 rounded-full bg-red-900/60 border border-red-500 flex items-center justify-center mb-3 text-red-400">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Generation Encountered An Issue</h3>
              <p className="text-xs text-white/80 leading-relaxed mb-5">{error}</p>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold tracking-wider uppercase transition-colors"
                >
                  Return to Start
                </button>
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
                >
                  <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
