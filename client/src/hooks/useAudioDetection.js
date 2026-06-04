import { useRef, useState, useCallback } from 'react';

const FFT_SIZE = 2048;
const SMOOTHING = 0.8;

// Frequency bands for pet distress detection (Hz)
const WHIMPER_LOW  = 500;
const WHIMPER_HIGH = 3000;
const YELP_LOW     = 1000;
const YELP_HIGH    = 8000;

// Thresholds (0–255 scale from Web Audio AnalyserNode)
const SPIKE_THRESHOLD     = 180; // sudden loud burst
const SUSTAINED_THRESHOLD = 120; // sustained high-freq sound
const SUSTAINED_FRAMES    = 8;   // ~0.8s of sustained sound

export function useAudioDetection({ onTrigger } = {}) {
  const ctxRef       = useRef(null);
  const analyserRef  = useRef(null);
  const sourceRef    = useRef(null);
  const rafRef       = useRef(null);
  const sustainedRef = useRef(0); // consecutive high-freq frames
  const baselineRef  = useRef(null); // rolling quiet baseline

  const [active,       setActive]       = useState(false);
  const [volume,       setVolume]       = useState(0);   // 0-100
  const [highFreqLevel, setHighFreqLevel] = useState(0); // 0-100
  const [alertReason,  setAlertReason]  = useState(null);

  const freqToIndex = useCallback((freq, sampleRate) =>
    Math.round((freq / (sampleRate / 2)) * (FFT_SIZE / 2)), []);

  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const sampleRate = ctxRef.current.sampleRate;

    // Overall RMS volume
    const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
    const volPct = Math.min(100, (rms / 255) * 100 * 3);
    setVolume(volPct);

    // High-frequency energy (whimper/yelp band)
    const loIdx = freqToIndex(WHIMPER_LOW, sampleRate);
    const hiIdx = freqToIndex(YELP_HIGH, sampleRate);
    const band  = data.slice(loIdx, hiIdx);
    const bandAvg = band.reduce((s, v) => s + v, 0) / (band.length || 1);
    const hfPct = Math.min(100, (bandAvg / 255) * 100 * 4);
    setHighFreqLevel(hfPct);

    // Update rolling baseline (very slow, 200 frames ~20s)
    if (baselineRef.current === null) baselineRef.current = rms;
    else baselineRef.current = baselineRef.current * 0.995 + rms * 0.005;

    const baseline = baselineRef.current;

    // 1. Sudden spike: current volume >> baseline  (yelp / bark)
    if (rms > SPIKE_THRESHOLD && rms > baseline * 3.5) {
      const confidence = Math.min(1, (rms - baseline * 3.5) / (255 - baseline * 3.5));
      onTrigger?.({ type: 'AUDIO_DISTRESS', reason: 'Sudden distress sound detected', confidence });
      setAlertReason('Sudden yelp or bark detected');
      sustainedRef.current = 0;
      rafRef.current = requestAnimationFrame(analyze);
      return;
    }

    // 2. Sustained high-frequency sound (whimper / howl)
    if (bandAvg > SUSTAINED_THRESHOLD) {
      sustainedRef.current += 1;
      if (sustainedRef.current >= SUSTAINED_FRAMES) {
        const confidence = Math.min(1, (bandAvg - SUSTAINED_THRESHOLD) / (255 - SUSTAINED_THRESHOLD));
        onTrigger?.({ type: 'AUDIO_DISTRESS', reason: 'Sustained whimper or howl detected', confidence });
        setAlertReason('Sustained whimper or howl detected');
        sustainedRef.current = 0;
      }
    } else {
      sustainedRef.current = Math.max(0, sustainedRef.current - 1);
      if (alertReason && volPct < 10) setAlertReason(null);
    }

    rafRef.current = requestAnimationFrame(analyze);
  }, [freqToIndex, onTrigger, alertReason]);

  const start = useCallback(async (stream) => {
    const ctx      = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize            = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    ctxRef.current      = ctx;
    analyserRef.current = analyser;
    sourceRef.current   = source;
    baselineRef.current = null;
    sustainedRef.current = 0;

    setActive(true);
    rafRef.current = requestAnimationFrame(analyze);
  }, [analyze]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    sourceRef.current?.disconnect();
    ctxRef.current?.close();
    ctxRef.current      = null;
    analyserRef.current = null;
    setActive(false);
    setVolume(0);
    setHighFreqLevel(0);
    setAlertReason(null);
  }, []);

  return { active, volume, highFreqLevel, alertReason, start, stop };
}
