import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, Camera } from 'lucide-react';
import { FlavourType } from '../types/photobooth';
import { playCountdownBeep, playShutterSound } from '../utils/audioService';

interface CaptureScreenProps {
  flavour: FlavourType;
  onCapture: (base64Image: string) => void;
  onBack: () => void;
}

export const CaptureScreen: React.FC<CaptureScreenProps> = ({
  flavour,
  onCapture,
  onBack,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Start camera stream
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      try {
        setErrorMessage(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch (err: any) {
        console.error('[Camera Error]', err);
        if (isMounted) {
          setErrorMessage(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access in your browser settings.'
              : 'Could not connect to camera device. Please check your webcam connection.'
          );
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      playCountdownBeep(700 - countdown * 80);
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      takeSnapshot();
    }
  }, [countdown]);

  const handleStartCountdown = () => {
    if (countdown !== null || !isReady) return;
    setCountdown(3);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger visual flash & audio sound
    setIsFlashing(true);
    playShutterSound();

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1080;
    const height = video.videoHeight || 1920;

    // Create a 9:16 portrait target canvas (1080 x 1920)
    canvas.width = 1080;
    canvas.height = 1920;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();

      // Mirror canvas horizontally if front-facing camera for natural selfie orientation
      const isMirrored = facingMode === 'user';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (isMirrored) {
        ctx.scale(-1, 1);
      }

      // Calculate object-cover crop into 1080x1920
      const targetAspect = 1080 / 1920;
      const sourceAspect = width / height;

      let sWidth = width;
      let sHeight = height;
      let sx = 0;
      let sy = 0;

      if (sourceAspect > targetAspect) {
        sWidth = height * targetAspect;
        sx = (width - sWidth) / 2;
      } else {
        sHeight = width / targetAspect;
        sy = (height - sHeight) / 2;
      }

      ctx.drawImage(
        video,
        sx,
        sy,
        sWidth,
        sHeight,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      );
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      setTimeout(() => {
        setIsFlashing(false);
        setCountdown(null);
        onCapture(dataUrl);
      }, 150);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Video element CSS transform: mirror if user camera
  const getVideoTransform = () => {
    return facingMode === 'user' ? 'scaleX(-1)' : 'none';
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none flex flex-col justify-between">
      {/* Live Video Viewfinder */}
      <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{ transform: getVideoTransform() }}
          className="w-full h-full object-cover transition-transform duration-300"
        />
      </div>

      {/* Camera Flash Overlay */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300 pointer-events-none" />
      )}

      {/* Top Controls Bar */}
      <div className="relative z-20 flex items-center justify-between p-4 safe-pt-top bg-gradient-to-b from-black/70 to-transparent">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Back to flavours"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white font-medium text-xs tracking-wider uppercase">
          {flavour === 'hot_ketchup' ? '🔥 Hot Ketchup' : '🧀 Four Cheese'}
        </div>

        <button
          onClick={toggleCameraFacing}
          className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Switch Camera"
        >
          <RefreshCw size={22} />
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="relative z-30 m-4 p-4 rounded-xl bg-red-900/80 border border-red-500 backdrop-blur-md text-white flex items-center gap-3">
          <AlertCircle size={24} className="text-red-300 flex-shrink-0" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Flavour Theme Configuration */}
      {(() => {
        const isHotKetchup = flavour === 'hot_ketchup';
        const theme = isHotKetchup
          ? {
              ringBorder: 'border-red-600',
              ringBorderHover: 'group-hover:border-red-500',
              ringShadow: 'shadow-[0_0_25px_rgba(229,9,20,0.75)]',
              pulseRingBorder: 'border-red-500/80',
              innerGradient: 'from-red-600 to-red-500',
              innerPulseAnim: 'animate-shutterBreatheRed',
              indicatorBg: 'bg-red-500',
              pingGlow: 'bg-red-500/30',
            }
          : {
              ringBorder: 'border-amber-500',
              ringBorderHover: 'group-hover:border-yellow-400',
              ringShadow: 'shadow-[0_0_25px_rgba(245,158,11,0.75)]',
              pulseRingBorder: 'border-yellow-400/80',
              innerGradient: 'from-amber-500 to-yellow-400',
              innerPulseAnim: 'animate-shutterBreatheYellow',
              indicatorBg: 'bg-yellow-400',
              pingGlow: 'bg-yellow-500/30',
            };

        return (
          <>
            {/* Animated 3-Second Countdown Overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div className="relative flex items-center justify-center">
                  {/* Pulsing Glow Rings */}
                  <div className={`absolute w-44 h-44 rounded-full ${theme.pingGlow} animate-ping`} />
                  <div
                    className={`w-32 h-32 rounded-full bg-gradient-to-tr ${theme.innerGradient} ${theme.ringShadow} border-4 border-white flex items-center justify-center`}
                  >
                    <span className="text-7xl font-black text-white font-mono drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-scaleIn">
                      {countdown}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Shutter Button (Dynamic Red/Yellow Theme with Interactive Pulsing) */}
            <div className="relative z-20 pb-12 safe-pb-controls pt-6 flex flex-col items-center justify-center bg-gradient-to-t from-black/85 via-black/40 to-transparent">
              <button
                onClick={handleStartCountdown}
                disabled={!isReady || countdown !== null}
                className="group relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none p-0 outline-none"
                style={{ background: 'transparent', border: 'none', padding: 0 }}
                aria-label="Tap to Capture"
              >
                {/* Pulsing Outer Expanding Glow Ring */}
                <div
                  className={`absolute inset-0 rounded-full border-2 ${theme.pulseRingBorder} animate-pulseRing pointer-events-none`}
                />

                {/* Outer Ring with Flavour Theme Glow */}
                <div
                  className={`absolute inset-0 rounded-full border-4 ${theme.ringBorder} ${theme.ringBorderHover} ${theme.ringShadow} transition-all duration-300`}
                />

                {/* Inner Solid Circle with Flavour Gradient & Interactive Breathing Pulse */}
                <div
                  className={`relative w-16 h-16 rounded-full bg-gradient-to-tr ${theme.innerGradient} ${theme.innerPulseAnim} shadow-inner group-hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center justify-center`}
                >
                  <Camera
                    size={26}
                    className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] pointer-events-none transition-transform duration-200 group-hover:scale-110"
                  />
                </div>
              </button>

              {/* Catchy Action Text */}
              <p className="mt-3.5 text-xs tracking-widest text-white font-black uppercase font-['Montserrat'] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] flex items-center gap-2 select-none">
                <span className={`inline-block w-2 h-2 rounded-full ${theme.indicatorBg} animate-ping`} />
                Tap to Capture
              </p>
            </div>
          </>
        );
      })()}
    </div>
  );
};
