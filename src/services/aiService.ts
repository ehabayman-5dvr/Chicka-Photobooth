import { FlavourType, GenerationResult } from '../types/photobooth';
import {
  advanceVariation,
  buildTransformationPrompt,
  getCurrentVariation,
} from './promptEngine';

export interface GenerationRequest {
  base64Image: string;
  flavour: FlavourType;
  onProgress?: (milestone: string, percent: number) => void;
}

let isGenerating = false;

function cleanBase64(dataUrl: string): { data: string; mimeType: string } {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl };
}

/**
 * Executes AI Image Transformation pipeline with environment variables (Vercel-ready)
 */
export async function generatePhotoboothImage(
  request: GenerationRequest
): Promise<GenerationResult> {
  if (isGenerating) {
    throw new Error('A photo generation is already in progress. Please wait.');
  }

  isGenerating = true;
  const { base64Image, flavour, onProgress } = request;
  const currentVar = getCurrentVariation(flavour);
  const prompt = buildTransformationPrompt(flavour);

  // Environment variables loaded from Vercel / .env.local
  const apiKey =
    (import.meta.env.VITE_OPENAI_API_KEY as string) ||
    (import.meta.env.VITE_AI_API_KEY as string) ||
    '';

  const rawModel =
    (import.meta.env.VITE_OPENAI_MODEL as string) ||
    (import.meta.env.VITE_AI_MODEL as string) ||
    'gpt-image-2.5-flare';

  // Normalize colloquial model names (e.g., 'gp5 2.5 flare' -> 'gpt-image-2.5-flare')
  let modelName = rawModel.trim();
  if (/^gp[t5]?\s*2\.5\s*flare$/i.test(modelName) || modelName.toLowerCase() === 'gp5 2.5 flare') {
    modelName = 'gpt-image-2.5-flare';
  } else if (/^gp[t5]?\s*2$/i.test(modelName)) {
    modelName = 'gpt-image-2';
  } else if (/^gp[t5]?\s*1\.5$/i.test(modelName)) {
    modelName = 'gpt-image-1.5';
  }

  const isMock = import.meta.env.VITE_MOCK_MODE === 'true';

  // Developer console logging for inspection
  console.log(
    `%c 🚀 CHICKA PHOTOBOOTH SYNTHESIS %c ${isMock ? 'MOCK DEV MODE' : modelName.toUpperCase()} %c`,
    'background: #E50914; color: #FFF; font-weight: 900; font-size: 13px; padding: 4px 8px; border-radius: 4px 0 0 4px;',
    'background: #111827; color: #F59E0B; font-weight: 700; font-size: 13px; padding: 4px 8px; border-radius: 0 4px 4px 0; border: 1px solid #F59E0B;',
    'background: transparent;'
  );
  console.log(
    '%c 🎯 Model:%c ' + modelName,
    'color: #0284c7; font-weight: bold; font-size: 12px;',
    'color: #00E5FF; font-weight: 700; font-size: 12px; margin-left: 6px; background: #0f172a; padding: 2px 8px; border-radius: 4px;'
  );
  console.log(
    '%c 🍿 Flavour & Variation:%c ' +
      flavour.toUpperCase() +
      ' | #' +
      (currentVar.index + 1) +
      ' of ' +
      currentVar.total +
      ' — ' +
      currentVar.variation.name,
    'color: #0284c7; font-weight: bold; font-size: 12px;',
    'color: #F59E0B; font-weight: 700; font-size: 12px; margin-left: 6px; background: #0f172a; padding: 2px 8px; border-radius: 4px;'
  );
  console.log(
    '%c 📝 Engineered Prompt:\n%c' + prompt,
    'color: #0284c7; font-weight: bold; font-size: 12px;',
    'background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 11px; padding: 10px 14px; border-radius: 6px; border-left: 4px solid #E50914; display: block; margin-top: 6px; line-height: 1.5; white-space: pre-wrap;'
  );

  const baseUrl =
    (import.meta.env.VITE_OPENAI_BASE_URL as string) ||
    (import.meta.env.VITE_AI_BASE_URL as string) ||
    'https://api.openai.com/v1';

  try {
    if (isMock) {
      // Simulate realistic synthesis milestones
      onProgress?.('Synthesizing custom attire & environment...', 35);
      await new Promise((r) => setTimeout(r, 1000));

      onProgress?.('Harmonizing lighting, textures & mascot...', 75);
      await new Promise((r) => setTimeout(r, 1100));

      onProgress?.('Finalizing 9:16 high-resolution output...', 95);
      await new Promise((r) => setTimeout(r, 700));

      // Advance variation sequentially in memory
      advanceVariation(flavour);

      return {
        imageUrl: currentVar.variation.sampleImagePath,
        prompt,
        variationName: currentVar.variation.name,
        variationIndex: currentVar.index,
        totalVariations: currentVar.total,
      };
    }

    // Live AI Generation: Calls secure Vercel serverless /api/generate endpoint
    // Keeps OPENAI_API_KEY secure on the server without exposing to client bundle
    onProgress?.(`Connecting to AI image service...`, 20);
    onProgress?.('Synthesizing Chicka artwork with AI...', 45);

    let generatedImageUrl = '';
    let cloudinaryUrl: string | undefined = undefined;

    try {
      const apiRes = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          prompt,
          flavour,
        }),
      });

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.imageUrl) {
          generatedImageUrl = json.imageUrl;
          cloudinaryUrl = json.cloudinaryUrl;
        }
      } else {
        const errData = await apiRes.json().catch(() => ({}));
        // If 404 (purely static hosting) and client apiKey exists, allow fallback
        if (apiRes.status === 404 && apiKey) {
          console.warn('[/api/generate returned 404, falling back to direct client call]');
        } else {
          throw new Error(
            errData.error || `AI Generation Error (${apiRes.status}): ${apiRes.statusText}`
          );
        }
      }
    } catch (apiErr: any) {
      if (apiKey && !generatedImageUrl) {
        console.warn('[/api/generate failed, attempting client fallback]', apiErr);
      } else {
        throw apiErr;
      }
    }

    // Direct client fallback if /api/generate was 404 and client apiKey is present
    if (!generatedImageUrl && apiKey) {
      const { data: imageBytes, mimeType } = cleanBase64(base64Image);
      const byteCharacters = atob(imageBytes);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const fileBlob = new Blob([byteArray], { type: mimeType });

      let mascotBlob: Blob | null = null;
      try {
        const mRes = await fetch('/assets/mascot/chicka-mascot-ref.jpg');
        if (mRes.ok) {
          mascotBlob = await mRes.blob();
        }
      } catch {
        // ignore
      }

      let packBlob: Blob | null = null;
      try {
        const packPath =
          flavour === 'four_cheese'
            ? '/assets/packs/four-cheese-pack-ref.jpg'
            : '/assets/packs/hot-ketchup-pack-ref.jpg';
        const pRes = await fetch(packPath);
        if (pRes.ok) {
          packBlob = await pRes.blob();
        }
      } catch {
        // ignore
      }

      const formData = new FormData();
      if (mascotBlob && packBlob) {
        formData.append('image[]', fileBlob, 'participant.jpg');
        formData.append('image[]', mascotBlob, 'chicka_mascot_reference.jpg');
        formData.append('image[]', packBlob, 'chicka_pack_reference.jpg');
      } else if (mascotBlob) {
        formData.append('image[]', fileBlob, 'participant.jpg');
        formData.append('image[]', mascotBlob, 'chicka_mascot_reference.jpg');
      } else {
        formData.append('image', fileBlob, 'participant.jpg');
      }

      formData.append('prompt', prompt);
      formData.append('model', modelName);
      formData.append('n', '1');
      formData.append('size', '1024x1792');

      const endpoint = `${baseUrl.replace(/\/+$/, '')}/images/edits`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          `AI API Error (${res.status}): ${errorData.error?.message || errorData.message || res.statusText}`
        );
      }

      const json = await res.json();
      const item = json.data?.[0];
      const b64 = item?.b64_json || item?.image;
      const url = item?.url;
      if (b64) {
        generatedImageUrl = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
      } else if (url) {
        generatedImageUrl = url;
      }
    }

    if (!generatedImageUrl) {
      throw new Error('AI Engine returned empty image response.');
    }

    onProgress?.('Finalizing high-resolution output...', 90);
    advanceVariation(flavour);

    return {
      imageUrl: generatedImageUrl,
      cloudinaryUrl,
      prompt,
      variationName: currentVar.variation.name,
      variationIndex: currentVar.index,
      totalVariations: currentVar.total,
    };
  } catch (error: any) {
    console.error('[AI Service Error]', error);
    throw error;
  } finally {
    isGenerating = false;
  }
}
