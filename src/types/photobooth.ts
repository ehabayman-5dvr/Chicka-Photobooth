export type FlavourType = 'hot_ketchup' | 'four_cheese';

export type ScreenType = 'start' | 'capture' | 'retake' | 'loading' | 'result';

export interface VariationConfig {
  id: string;
  name: string;
  sceneName: string;
  sceneDescription: string;
  outfitName: string;
  outfitDescription: string;
  mascotDescription: string;
  sampleImagePath: string;
}

export interface GenerationResult {
  imageUrl: string;
  prompt: string;
  variationName: string;
  variationIndex: number;
  totalVariations: number;
}
