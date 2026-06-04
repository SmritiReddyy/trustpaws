import { useRef, useState, useCallback } from 'react';

const BUFFER_SECONDS     = 30;
const POST_TRIGGER_SECS  = 8;
const MOTION_THRESHOLD   = 12;   // avg pixel diff per channel (0–255)
const MOTION_SPIKE_MULT  = 4.5;  // spike vs rolling baseline
const CANVAS_W           = 320;
const CANVAS_H           = 240;
const CHUNK_INTERVAL_MS  = 1000;

export function useVideoMonitor({ onTrigger } = {}) {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(document.createElement('canvas'));
  const streamRef     = useRef(null);
  const recorderRef   = useRef(null);
  const chunksRef     = useRef([]);
  const prevFrameRef  = useRef(null);
  const rafRef        = useRef(null);
  const baselineRef   = useRef(null);
  const triggeringRef = useRef(false); // prevent double triggers
  const postChunksRef = useRef([]);    // chunks recorded after trigger
  const postTimerRef  = useRef(null);

  const [active,       setActive]       = useState(false);
  const [motionLevel,  setMotionLevel]  = useState(0);
  const [alertReason,  setAlertReason]  = useState(null);
  const [stream,       setStream]       = useState(null);

  const analyzeFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H);
    const frame = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);

    if (prevFrameRef.current) {
      let diff = 0;
      const len = frame.data.length;
      for (let i = 0; i < len; i += 4) {
        diff += Math.abs(frame.data[i]   - prevFrameRef.current.data[i]);
        diff += Math.abs(frame.data[i+1] - prevFrameRef.current.data[i+1]);
        diff += Math.abs(frame.data[i+2] - prevFrameRef.current.data[i+2]);
      }
      const avgDiff = diff / (len * 0.75); // per channel avg

      // Update rolling baseline
      if (baselineRef.current === null) baselineRef.current = avgDiff;
      else baselineRef.current = baselineRef.current * 0.97 + avgDiff * 0.03;

      const level = Math.min(100, (avgDiff / 50) * 100);
      setMotionLevel(level);

      const baseline = baselineRef.current;
      const isSuddenSpike = avgDiff > MOTION_THRESHOLD && avgDiff > baseline * MOTION_SPIKE_MULT;

      if (isSuddenSpike && !triggeringRef.current) {
        const confidence = Math.min(1, (avgDiff - baseline * MOTION_SPIKE_MULT) / 30);
        triggeringRef.current = true;
        setAlertReason('Sudden movement detected — possible flinch or recoil');
        onTrigger?.({ type: 'MOTION_SPIKE', reason: 'Sudden motion spike', confidence });

        // Allow re-triggering after cooldown
        setTimeout(() => { triggeringRef.current = false; }, 5000);
      }
    }

    prevFrameRef.current = frame;
    rafRef.current = requestAnimationFrame(analyzeFrame);
  }, [onTrigger]);

  const start = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' },
        audio: true,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Set up rolling buffer recorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(mediaStream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current   = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          if (chunksRef.current.length > BUFFER_SECONDS) chunksRef.current.shift();
        }
      };

      recorder.start(CHUNK_INTERVAL_MS);
      setActive(true);
      baselineRef.current = null;
      prevFrameRef.current = null;
      rafRef.current = requestAnimationFrame(analyzeFrame);
    } catch (err) {
      console.error('Camera access error:', err);
      throw err;
    }
  }, [analyzeFrame]);

  // Called by parent when a trigger fires — captures post-trigger footage then assembles clip
  const captureClip = useCallback(() => {
    return new Promise((resolve) => {
      const preChunks = [...chunksRef.current];
      postChunksRef.current = [];

      // Record POST_TRIGGER_SECS more seconds
      const tempRecorder = new MediaRecorder(streamRef.current, {
        mimeType: recorderRef.current?.mimeType || 'video/webm',
      });

      tempRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) postChunksRef.current.push(e.data);
      };

      tempRecorder.onstop = () => {
        const allChunks = [...preChunks, ...postChunksRef.current];
        const blob = new Blob(allChunks, { type: 'video/webm' });
        resolve(blob);
      };

      tempRecorder.start(CHUNK_INTERVAL_MS);
      postTimerRef.current = setTimeout(() => tempRecorder.stop(), POST_TRIGGER_SECS * 1000);
    });
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(postTimerRef.current);
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current   = null;
    recorderRef.current = null;
    chunksRef.current   = [];
    prevFrameRef.current = null;
    baselineRef.current  = null;
    triggeringRef.current = false;
    setActive(false);
    setMotionLevel(0);
    setAlertReason(null);
    setStream(null);
  }, []);

  const clearAlert = useCallback(() => setAlertReason(null), []);

  return { active, motionLevel, alertReason, stream, videoRef, start, stop, captureClip, clearAlert };
}
