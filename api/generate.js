// Vercel Serverless Function: Secure OpenAI Image Generation Endpoint
// Keeps OPENAI_API_KEY private on the server (never exposed to browser clients)

export const config = {
  maxDuration: 60, // Allow up to 60s for high-resolution image synthesis
};

import fs from 'node:fs';
import path from 'node:path';

// Pre-load official Chicka Mascot 3D reference image
let mascotBuffer = null;
try {
  const candidatePaths = [
    path.join(process.cwd(), 'api', 'assets', 'chicka-mascot-ref.jpg'),
    path.join(process.cwd(), 'public', 'assets', 'mascot', 'chicka-mascot-ref.jpg'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      mascotBuffer = fs.readFileSync(p);
      break;
    }
  }
} catch (e) {
  console.warn('[API] Could not load mascot reference file:', e);
}

function recordMetrics(flavour, modelName) {
  const metricsUrl =
    process.env.METRICS_API_URL ||
    'https://ai-photobooth-dashboard-brown.vercel.app/api/projects/a8d114ef-df55-49eb-a039-451b8a572eb4/generate';

  fetch(metricsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      presetName: flavour || 'chicka_puffs',
      provider: 'openai',
      timestamp: Date.now(),
    }),
    signal: AbortSignal.timeout(5000),
  })
    .then((r) => {
      if (r.ok) console.log('[Metrics] Generation recorded in 5DVR dashboard');
      else console.warn('[Metrics] Dashboard returned status:', r.status);
    })
    .catch((err) => console.warn('[Metrics] Failed to record generation:', err.message));
}

function cleanBase64(dataUrl) {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // keep as is
      }
    }

    const { image, prompt, flavour } = body || {};

    if (!image || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: image and prompt' });
    }

    // Read server-side environment variables (protected on Vercel)
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.VITE_OPENAI_API_KEY ||
      '';

    if (!apiKey) {
      return res.status(500).json({
        error:
          'OpenAI API Key is not configured on the server. Please add OPENAI_API_KEY to your Vercel Environment Variables.',
      });
    }

    // Target model with normalization
    const rawModel =
      process.env.OPENAI_MODEL ||
      process.env.VITE_OPENAI_MODEL ||
      'gpt-image-2.5-flare';

    let modelName = rawModel.trim();
    if (/^gp[t5]?\s*2\.5\s*flare$/i.test(modelName) || modelName.toLowerCase() === 'gp5 2.5 flare') {
      modelName = 'gpt-image-2.5-flare';
    } else if (/^gp[t5]?\s*2$/i.test(modelName)) {
      modelName = 'gpt-image-2';
    } else if (/^gp[t5]?\s*1\.5$/i.test(modelName)) {
      modelName = 'gpt-image-1.5';
    }

    const baseUrl =
      process.env.OPENAI_BASE_URL ||
      process.env.VITE_OPENAI_BASE_URL ||
      'https://api.openai.com/v1';

    // Convert base64 data URL to Blob
    const { data: b64Data, mimeType } = cleanBase64(image);
    const buffer = Buffer.from(b64Data, 'base64');
    const fileBlob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();

    // Multi-reference image support: pass live participant and official mascot reference
    if (mascotBuffer) {
      formData.append('image[]', fileBlob, 'participant.jpg');
      formData.append(
        'image[]',
        new Blob([mascotBuffer], { type: 'image/jpeg' }),
        'chicka_mascot_reference.jpg'
      );
    } else {
      formData.append('image', fileBlob, 'participant.jpg');
    }

    formData.append('prompt', prompt);
    formData.append('model', modelName);
    formData.append('n', '1');
    formData.append('size', '1024x1792');

    const endpoint = `${baseUrl.replace(/\/+$/, '')}/images/edits`;
    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!aiRes.ok) {
      const errorData = await aiRes.json().catch(() => ({}));
      const msg = errorData.error?.message || errorData.message || aiRes.statusText;
      return res.status(aiRes.status).json({
        error: `OpenAI API Error (${aiRes.status}): ${msg}`,
      });
    }

    const json = await aiRes.json();
    const item = json.data?.[0];
    const b64 = item?.b64_json || item?.image;
    const url = item?.url;

    if (b64 || url) {
      // Fire-and-forget non-blocking dashboard metrics counter
      recordMetrics(flavour, modelName);
    }

    if (b64) {
      const dataUrl = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
      return res.status(200).json({ imageUrl: dataUrl, model: modelName });
    }

    if (url) {
      return res.status(200).json({ imageUrl: url, model: modelName });
    }

    return res.status(500).json({ error: 'OpenAI returned empty image output' });
  } catch (error) {
    console.error('[API /api/generate Error]', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during AI image generation',
    });
  }
}
