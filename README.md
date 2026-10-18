# Chicka Puffs AI Photobooth (Web Edition)

A high-energy, responsive web-based AI photobooth application tailored for **"Chicka" Snack Puffs**. Built with React, Vite, TypeScript, and modern Vanilla CSS tokens, fully optimized for mobile browsers and Vercel hosting.

---

## 🌟 Key Features

- **Pure Web-Based Experience**: Designed specifically for mobile & desktop web browsers—no Electron builds, no printer drivers, and no QR code clutter.
- **Ultra-Lightweight Mobile Footprint**: Zero heavy neural network dependencies (`face-api.js` / `@tensorflow/tfjs` removed) and no bulky operator modals. The total production bundle is only **~62 kB gzipped**, guaranteeing instant loading and smooth 60 FPS performance on mobile devices.
- **Vercel & Environment Variable Ready**: Fully configured to load AI credentials directly from Vercel environment variables (`VITE_OPENAI_API_KEY` and `VITE_OPENAI_MODEL="gp5 2.5 flare"`).
- **Graceful Mock Fallback**: Includes a fallback mode (`VITE_MOCK_MODE=true` or absent API key) with reference generations so you can test and preview the entire user journey immediately without consuming API tokens.
- **9:16 Vertical Portrait Ratio**: All viewfinders, frames, and generated AI images are strictly formatted in vertical 9:16 portrait.
- **Sequential Variation Engine**:
  - **4 Sequential Variations per Flavour** cycling in memory (`0 -> 1 -> 2 -> 3 -> 0`) until page reload.
  - Aligned scene, outfit, and Chicka mascot pairing.
  - Flavour switch automatically resets the sequence index back to `0`.
- **1:1 Identity & Cultural Headcover Preservation**:
  - Multimodal vision prompts preserve natural facial identity, expression, jawline, eye shape, and cultural/religious headcovers (hijab/sheila) from the photo itself, while enforcing modesty and seamless brand integration.
- **Mobile Camera Controls**:
  - In-viewfinder front/back camera switch (`user` / `environment`).
  - Automatic horizontal selfie mirroring on front camera.
  - 3-second animated countdown and camera flash.
- **Pixel-Perfect Screen Flow**:
  1. **Start Screen**: High-energy video loop (`Start_Screen_Loop.mp4`) with split Hot Ketchup and Four Cheese CTA buttons.
  2. **Camera Capture Screen**: Clean 9:16 viewfinder, camera flip, circular red shutter button, and a 3-second animated countdown.
  3. **Retake / Preview Screen**: Themed 1080x1920 frame (`Four-Cheese.png` or `Hot-Ketchup.png`), 5-second circular auto-proceed countdown badge, and glossy Retake Photo CTA.
  4. **Thematic Loading Screen**: `Loading-Screen.mp4` animated background, dynamic milestone status messages, and glowing gradient circular progress ring.
  5. **Result Screen**: 9:16 transformed photo, confetti celebration, and 3 primary actions: **Restart**, **Share** (Web Share API with fallback), and **Download**.

---

## 📸 Sequential Variations Matrix

### 🧀 Four Cheese Variations
| # | Variation Name | Setting & Environment | Attire & Styling | Chicka Mascot Interaction |
|---|---|---|---|---|
| **1** | **Carnival Roller Coaster** | Sun-drenched carnival at golden hour with looping cheese roller coaster tracks & flying puffs | Sporty yellow/black streetwear windbreaker with dark goggles on forehead | Cheetah sitting in the coaster cart with furry arm over shoulder, cheering |
| **2** | **Golden Disco Dance Club** | Dazzling golden disco lounge with giant gold mirror ball, confetti, and neon cheese signs | Statement yellow/black patterned blazer or metallic gold jacket with star/disco shades | Cheetah wearing star-shaped disco shades, arm around subject, waving |
| **3** | **Food Science Lab** | Quirky laboratory with bubbling golden cheese potion beakers and puff extrusion machine | Crisp white lab scientist coat with clear safety goggles on forehead | Cheetah wearing lab goggles, holding bubbling Erlenmeyer flask of cheese potion |
| **4** | **Cheese Vault Heist** | High-security bank vault with open steel door, security lasers, and piles of cheese | Stealth black bomber jacket with yellow zip accents, black knit beanie & gloves | Cheetah wearing black bandit domino mask with a partner-in-crime smirk |

### 🔥 Hot Ketchup Variations
| # | Variation Name | Setting & Environment | Attire & Styling | Chicka Mascot Interaction |
|---|---|---|---|---|
| **1** | **Urban Streetwear Shoot** | Contemporary brand photoshoot studio with bold crimson/black geometric backdrop | Oversized colorblock burgundy/black bomber jacket, layered silver chains, dark shades | Cheetah wearing classic black wayfarer sunglasses with confident arm-over-shoulder pose |
| **2** | **Retro Neon Arcade** | Retro 80s/90s neon arcade gaming lounge with Pac-Man cabinets and glowing neon signs | Nostalgic 90s color-blocked track jacket (red/black/yellow stripes) over tee | Cheetah with playful smug gamer grin and arm casually draped over shoulder |
| **3** | **Graffiti Street Art Alley** | Edgy urban alleyway and raw concrete studio covered in colorful graffiti tags and wheatpaste | Black and white varsity bomber jacket, ribbed red collar, over-ear DJ headphones & chains | Cheetah wearing black shades, leaning in as a cool buddy |
| **4** | **Speed Club Racing Pit Stop** | Motorsport pit lane at night under floodlights, GT race cars, and Chicka Speed Club banner | Professional red/white/black racing driver suit with sponsor patches, cap & headset | Cheetah wearing pit crew radio headset with boom mic, flashing a peace sign |

---

## ⚙️ Environment Variables (Vercel)

Configure the following environment variables in your Vercel Project Settings (`Settings -> Environment Variables`) or in your local `.env.local` file:

```env
# API Key for GP5 2.5 Flare / OpenAI-compatible endpoint
VITE_OPENAI_API_KEY=your_api_key_here

# Target AI Model (Defaults to 'gp5 2.5 flare')
VITE_OPENAI_MODEL=gp5 2.5 flare

# Optional: Set to 'true' to run offline with bundled sample assets without consuming API credits
VITE_MOCK_MODE=false
```

---

## 🛠️ Developer Setup & Commands

### 1. Installation
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Production Build (for Vercel)
```bash
npm run build
```
Generates the optimized production bundle in `dist/`.

---

## 📁 Project Structure

```
├── .agents/skills/          # Photobooth skills submodule
├── public/
│   ├── assets/              # Chicka brand video loops, buttons, frames
│   │   ├── start/           # Start screen video loop & flavor buttons
│   │   ├── retake/          # 1080x1920 frames & retake buttons
│   │   ├── loading/         # Loading screen video loop
│   │   └── result/          # Action buttons (Restart, Share, Download)
│   └── samples/             # 4 Cheese & 4 Hot Ketchup reference samples
├── src/
│   ├── components/
│   │   ├── StartScreen.tsx      # Video loop & dual flavour buttons
│   │   ├── CaptureScreen.tsx    # Live viewfinder, camera flip, 3s countdown, red shutter
│   │   ├── RetakeScreen.tsx     # 1080x1920 frame & 5s auto-proceed badge
│   │   ├── LoadingScreen.tsx    # Loading animation, milestones & AI call
│   │   └── ResultScreen.tsx     # 9:16 portrait display, Restart/Share/Download
│   ├── services/
│   │   ├── aiService.ts         # GP5 2.5 Flare synthesis via Vercel env vars & mock mode
│   │   └── promptEngine.ts      # 4 sequential variations & multimodal prompt builder
│   ├── types/photobooth.ts      # Core TypeScript interfaces
│   ├── utils/audioService.ts    # Web Audio shutter, beeps & chimes
│   ├── App.tsx                  # Clean screen flow state machine
│   ├── index.css                # Custom Vanilla CSS design system
│   └── main.tsx                 # Root entry
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```
