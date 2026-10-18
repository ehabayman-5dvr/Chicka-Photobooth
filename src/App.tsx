import React, { useState } from 'react';
import { FlavourType, GenerationResult, ScreenType } from './types/photobooth';
import { setFlavour } from './services/promptEngine';
import { StartScreen } from './components/StartScreen';
import { CaptureScreen } from './components/CaptureScreen';
import { RetakeScreen } from './components/RetakeScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultScreen } from './components/ResultScreen';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('start');
  const [flavour, setBoothFlavour] = useState<FlavourType>('four_cheese');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const handleSelectFlavour = (selected: FlavourType) => {
    setBoothFlavour(selected);
    setFlavour(selected);
    setCurrentScreen('capture');
  };

  const handleCapture = (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setCurrentScreen('retake');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCurrentScreen('capture');
  };

  const handleProceedToLoading = () => {
    setCurrentScreen('loading');
  };

  const handleGenerationSuccess = (result: GenerationResult) => {
    setGenerationResult(result);
    setCurrentScreen('result');
  };

  const handleRestart = () => {
    setCapturedImage(null);
    setGenerationResult(null);
    setCurrentScreen('start');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-neutral-950 flex items-center justify-center">
      {/* Mobile Web Viewport Frame maintaining 9:16 portrait ratio */}
      <main className="relative w-full h-full max-w-[540px] max-h-[960px] aspect-[9/16] overflow-hidden bg-black shadow-2xl flex flex-col">
        {currentScreen === 'start' && (
          <StartScreen onSelectFlavour={handleSelectFlavour} />
        )}

        {currentScreen === 'capture' && (
          <CaptureScreen
            flavour={flavour}
            onCapture={handleCapture}
            onBack={() => setCurrentScreen('start')}
          />
        )}

        {currentScreen === 'retake' && capturedImage && (
          <RetakeScreen
            capturedImage={capturedImage}
            flavour={flavour}
            onProceed={handleProceedToLoading}
            onRetake={handleRetake}
          />
        )}

        {currentScreen === 'loading' && capturedImage && (
          <LoadingScreen
            capturedImage={capturedImage}
            flavour={flavour}
            onSuccess={handleGenerationSuccess}
            onCancel={handleRestart}
          />
        )}

        {currentScreen === 'result' && generationResult && (
          <ResultScreen
            result={generationResult}
            flavour={flavour}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
};
