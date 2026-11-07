/**
 * Audio processing utilities:
 * - Generates real playable WAV files in-browser
 * - Handles microphone recording
 * - Audio buffer analysis
 */

// Simple WAV file encoder from an AudioBuffer or PCM data
export function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples (float to 16-bit PCM)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Synthesizes a simulated audio track in memory with customized pitch/tone harmonics
 * to produce a valid WAV file matching voice characteristics.
 */
export function generateSynthesizedVoiceWav(
  durationSec: number = 3.5,
  baseFreq: number = 180,
  sampleRate: number = 24000
): Blob {
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Harmonic formant simulation representing human speech cadence
    const formant1 = Math.sin(2 * Math.PI * baseFreq * t);
    const formant2 = 0.5 * Math.sin(2 * Math.PI * (baseFreq * 2.1) * t);
    const formant3 = 0.25 * Math.sin(2 * Math.PI * (baseFreq * 3.4) * t);

    // Natural speech envelope (syllable rhythm around 4Hz)
    const envelope = Math.max(0, Math.sin(2 * Math.PI * 3.5 * t));
    const breath = (Math.random() * 2 - 1) * 0.04;

    // Decay at beginning and end
    const edgeFade = Math.min(1, Math.min(t / 0.1, (durationSec - t) / 0.1));

    samples[i] = (formant1 + formant2 + formant3 + breath) * envelope * edgeFade * 0.45;
  }

  return encodeWAV(samples, sampleRate);
}
