// Vercel Serverless Function: Secure OpenAI Image Generation Endpoint
// Keeps OPENAI_API_KEY private on the server (never exposed to browser clients)

export const config = {
  maxDuration: 60, // Allow up to 60s for high-resolution image synthesis
};

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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

// Pre-load official Chicka Puffs Pack reference images
const packBuffers = {
  four_cheese: null,
  hot_ketchup: null,
};

function getPackBuffer(flavour) {
  const key = flavour === 'four_cheese' ? 'four_cheese' : 'hot_ketchup';
  if (packBuffers[key]) return packBuffers[key];

  const filename = key === 'four_cheese' ? 'four-cheese-pack-ref.jpg' : 'hot-ketchup-pack-ref.jpg';
  const candidatePaths = [
    path.join(process.cwd(), 'api', 'assets', 'packs', filename),
    path.join(process.cwd(), 'public', 'assets', 'packs', filename),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        packBuffers[key] = fs.readFileSync(p);
        console.log(`[API] Loaded pack reference image for ${key} from: ${p}`);
        return packBuffers[key];
      } catch (err) {
        console.warn(`[API] Could not read pack file ${p}:`, err.message);
      }
    }
  }
  return null;
}

function generateSha1(message) {
  return crypto.createHash('sha1').update(message).digest('hex');
}

async function uploadToCloudinary(imageSource, defaultFolder = 'Chicka-Photobooth') {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const targetFolder = process.env.CLOUDINARY_FOLDER || defaultFolder;

  if (!cloudName || !apiKey || !apiSecret) {
    console.log('[Cloudinary] Credentials not configured, skipping cloud archive');
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // 1. Sort parameters alphabetically for signed upload
  const paramsToSign = {
    folder: targetFolder,
    timestamp,
  };

  const sortedParamsString = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');

  // 2. Generate SHA-1 signature
  const stringToSign = `${sortedParamsString}${apiSecret}`;
  const signature = generateSha1(stringToSign);

  // 3. Assemble multipart payload
  const formData = new FormData();
  formData.append('file', imageSource);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', targetFolder);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Cloudinary] Upload returned ${res.status}:`, errText);
      return null;
    }

    const data = await res.json();
    const secureUrl = data.secure_url || data.url || null;
    console.log(`[Cloudinary] Photo uploaded successfully to folder '${targetFolder}':`, secureUrl);
    return secureUrl;
  } catch (err) {
    console.warn('[Cloudinary] Failed to upload photo to Cloudinary:', err.message);
    return null;
  }
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

    const packBuffer = getPackBuffer(flavour);

    // Multi-reference image support: pass live participant, official mascot reference, and official pack reference
    if (mascotBuffer && packBuffer) {
      formData.append('image[]', fileBlob, 'participant.jpg');
      formData.append(
        'image[]',
        new Blob([mascotBuffer], { type: 'image/jpeg' }),
        'chicka_mascot_reference.jpg'
      );
      formData.append(
        'image[]',
        new Blob([packBuffer], { type: 'image/jpeg' }),
        'chicka_pack_reference.jpg'
      );
    } else if (mascotBuffer) {
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

    let finalImageUrl = null;
    if (b64) {
      finalImageUrl = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
    } else if (url) {
      finalImageUrl = url;
    }

    if (finalImageUrl) {
      // Automatic Cloudinary archive to folder 'Chicka-Photobooth'
      let cloudUrl = null;
      try {
        cloudUrl = await uploadToCloudinary(finalImageUrl, 'Chicka-Photobooth');
      } catch (cErr) {
        console.warn('[Cloudinary] Upload error (continuing with dataUrl):', cErr);
      }

      return res.status(200).json({
        imageUrl: cloudUrl || finalImageUrl,
        cloudinaryUrl: cloudUrl,
        model: modelName,
      });
    }

    return res.status(500).json({ error: 'OpenAI returned empty image output' });
  } catch (error) {
    console.error('[API /api/generate Error]', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during AI image generation',
    });
  }
}
