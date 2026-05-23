# Ethereal Echoes

Ethereal Echoes is a high-fidelity cinematic emotional presence system. By prioritizing absolute visual minimalism, it establishes a singular focal presence using a reactive centerpiece orb, a dynamic canvas particle swarm field, and a real-time web synthesizer. 

The system leverages artificial intelligence and Web Audio APIs to create a calm, organic, and conscious conversational companion.

---

## Technical Features

### 1. Emotional Pause Engine
* Introduces intentional silence and conversational hesitation.
* Evaluates active user emotions to compute custom pre-response pauses (ranging from 500ms to 2400ms).
* Automatically dampens background sounds, slows down the organic breathing pulse, and fades active visualizers during pause phases to establish conversational anticipation.

### 2. Unified Emotional Flow Director
* Coordinates visual and audio variables across seven distinct emotional states: Calm, Melancholic, Anxious, Reflective, Excited, Lonely, and Playful.
* Drives linear interpolation loops running at 60fps to transition color spectrums, LFO synthesizer rates, breathing intervals, and glow boundaries cleanly without visual steps.

### 3. Audio-Reactive Swarm Burst
* Features a custom HTML Canvas particle engine centered around the microphone orb.
* Emits radial particle swarms triggered on vocal speech onset and syllable energy surges.
* Scales swarm velocity, spread, and gravity in real-time according to RMS amplitude thresholds.

### 4. Soft Memory Surfacing
* Utilizes a Supabase Postgres layer to persist and trace emotional themes and memory records.
* Avoids analytical dashboards and technical structures, instructing the AI to recall and verbalize memories poetically (e.g., "I remember you mentioning this before..." or "You've spoken about this feeling before...").

---

## Architectural Layout

```
[User Vocal Input] 
       │
       ▼
[webkitSpeechRecognition] ────► [Speech Silence Timeout]
                                        │
                                        ▼
[OpenAI API (JSON Matrix)] ◄──── [Conscious Pause Engine]
       │                                │
       ▼                                ├─► [Ducks Synth Drone]
[ElevenLabs TTS Stream]                 ├─► [Damps Orb Floating]
       │                                └─► [Drifts Particles to Stillness]
       ▼
[Master Audio Output] ──► [60fps HTML Canvas Particle Burst]
```

---

## Getting Started

### Prerequisites
* Node.js (v20.x or higher recommended)
* NPM or Yarn package manager

### Environment Configuration
Create a `.env.local` file in the root directory and populate the following keys:

```ini
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs Configuration (TTS)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_selected_voice_id

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation & Run

1. Clone the repository and install the Node dependencies:
   ```bash
   npm install
   ```

2. Launch the local Next.js development server:
   ```bash
   npm run dev
   ```

3. Open the application in your browser:
   Navigate to `http://localhost:3000`. Click the centerpiece orb to initialize the Web Audio context and begin the session.
