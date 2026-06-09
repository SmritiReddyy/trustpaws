import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft, Video, VideoOff, Mic, MicOff, AlertTriangle,
  CheckCircle, Play, Trash2, Eye, RefreshCw, Bot,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAudioDetection } from '../../hooks/useAudioDetection';
import { useVideoMonitor }   from '../../hooks/useVideoMonitor';

const COOLDOWN_MS = 12000;
const COMMENTARY_INTERVAL_MS = 30000;
const MAX_UPDATES = 20;
const GEMINI_MODEL = 'gemini-2.0-flash';
const SYSTEM_PROMPT =
  'You are an AI assistant monitoring a dog grooming session via camera. Describe what you observe in 1-2 short plain sentences. Focus on the dog\'s activity and the groomer\'s actions. If audio events are provided, incorporate them naturally. Be calm and factual, written for a pet parent.';

async function fetchCommentary(base64Image, recentEvents) {
  const eventsText = recentEvents.length
    ? recentEvents.map((e) => e.description).join('; ')
    : 'none';
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
          { text: `Recent events in the last 30s: ${eventsText}` },
        ],
      }],
      generationConfig: { maxOutputTokens: 150 },
    }),
  });
  if (!resp.ok) throw new Error(`Gemini API ${resp.status}`);
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}


export default function Monitor() {
  const { id } = useParams();
  const [appt,        setAppt]        = useState(null);
  const [clips,       setClips]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [monitoring,      setMonitoring]      = useState(false);
  const [alert,           setAlert]           = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [sessionUpdates,  setSessionUpdates]  = useState([]);
  const [analyzing,       setAnalyzing]       = useState(false);
  const lastTriggerRef    = useRef(0);
  const recentEventsRef   = useRef([]);
  const commentaryCanvasRef = useRef(null);

  // ── Load appointment ──────────────────────────────────────────────────────
  const loadClips = useCallback(() =>
    api.get(`/clips/appointment/${id}`).then((r) => setClips(r.data)), [id]);

  useEffect(() => {
    api.get(`/appointments/${id}`)
      .then((r) => setAppt(r.data))
      .finally(() => setLoading(false));
    loadClips();
  }, [id, loadClips]);

  // ── Trigger handler (shared by audio + video) ─────────────────────────────
  const handleTrigger = useCallback(async ({ type, reason, confidence }) => {
    const now = Date.now();
    recentEventsRef.current.push({ time: now, description: reason });
    if (now - lastTriggerRef.current < COOLDOWN_MS) return;
    lastTriggerRef.current = now;

    setAlert({ reason, type, confidence });
    toast.error(`⚠️ ${reason}`, { duration: 8000, id: 'distress-alert' });

    // Capture clip
    setSaving(true);
    try {
      const blob = await captureClip();
      const form = new FormData();
      form.append('clip', blob, 'clip.webm');
      form.append('appointmentId', id);
      form.append('triggerType', type);
      form.append('confidence', String(confidence ?? 0));
      form.append('durationSec', String(30 + 8));
      await api.post('/clips', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Clip saved & incident auto-created');
      loadClips();
    } catch (err) {
      toast.error('Failed to save clip');
    } finally {
      setSaving(false);
    }
  }, [id, loadClips]);

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const audio = useAudioDetection({ onTrigger: monitoring ? handleTrigger : undefined });
  const video = useVideoMonitor({ onTrigger: monitoring ? handleTrigger : undefined });
  const { captureClip } = video;

  // ── Start / stop monitoring ───────────────────────────────────────────────
  const startMonitoring = useCallback(async () => {
    try {
      await video.start();
      await audio.start(video.stream);
      setMonitoring(true);
      setAlert(null);
      toast.success('Monitoring started');
    } catch (err) {
      toast.error('Camera/mic access denied. Please allow permissions.');
    }
  }, [video, audio]);

  const stopMonitoring = useCallback(() => {
    audio.stop();
    video.stop();
    setMonitoring(false);
    setAlert(null);
    toast('Monitoring stopped', { icon: '⏹' });
  }, [audio, video]);

  // stop on unmount
  useEffect(() => () => { audio.stop(); video.stop(); }, []);

  // AI commentary — capture frame + call Gemini
  const runCommentary = useCallback(async () => {
    const videoEl = video.videoRef.current;
    const canvas  = commentaryCanvasRef.current;
    if (!videoEl || !canvas || videoEl.readyState < 2) return;

    canvas.width  = 320;
    canvas.height = 240;
    canvas.getContext('2d').drawImage(videoEl, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const base64  = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

    const now = Date.now();
    const window30s = recentEventsRef.current.filter((e) => now - e.time <= 30000);
    recentEventsRef.current = window30s;

    setAnalyzing(true);
    try {
      const text = await fetchCommentary(base64, window30s);
      if (!text) return;
      const timestamp = format(new Date(), 'HH:mm');
      setSessionUpdates((prev) => [{ time: timestamp, text }, ...prev].slice(0, MAX_UPDATES));
    } catch (err) {
      console.error('[Session Updates] Gemini API error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [video.videoRef]);

  // AI commentary interval — fire immediately, then every 30s
  useEffect(() => {
    if (!monitoring) return;
    // slight delay so video element is ready after start
    const firstTimeout = setTimeout(() => runCommentary(), 3000);
    const intervalId   = setInterval(() => runCommentary(), COMMENTARY_INTERVAL_MS);
    return () => { clearTimeout(firstTimeout); clearInterval(intervalId); };
  }, [monitoring, runCommentary]);

  // ── Manual clip save ──────────────────────────────────────────────────────
  const saveManualClip = useCallback(async () => {
    setSaving(true);
    try {
      const blob = await captureClip();
      const form = new FormData();
      form.append('clip', blob, 'clip.webm');
      form.append('appointmentId', id);
      form.append('triggerType', 'MANUAL');
      await api.post('/clips', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Manual clip saved');
      loadClips();
    } catch { toast.error('Failed to save clip'); }
    finally { setSaving(false); }
  }, [captureClip, id, loadClips]);

  const deleteClip = async (clipId) => {
    if (!confirm('Delete this clip?')) return;
    await api.delete(`/clips/${clipId}`);
    loadClips();
  };

  const markReviewed = async (clipId) => {
    await api.patch(`/clips/${clipId}/reviewed`);
    loadClips();
  };

  if (loading) return <div className="card text-center py-10 text-gray-400">Loading…</div>;
  if (!appt) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/appointments" className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold text-gray-900">Live Monitor</h1>
      </div>
      <div className="card text-center py-6 text-red-400">Appointment not found</div>
    </div>
  );

  const unreviewed = clips.filter((c) => !c.reviewed);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/appointments/${id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">
            Live Monitor — {appt.pet.name}
          </h1>
          <p className="text-sm text-gray-500">{appt.pet.breed} · {appt.pet.parent.name}</p>
        </div>
        {unreviewed.length > 0 && (
          <span className="badge bg-red-100 text-red-700 text-sm">
            <AlertTriangle size={12} className="mr-1" />
            {unreviewed.length} unreviewed
          </span>
        )}
      </div>

      {/* Alert banner */}
      {alert && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={22} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-700">Distress Detected</p>
            <p className="text-sm text-red-600 mt-0.5">{alert.reason}</p>
            {alert.confidence != null && (
              <p className="text-xs text-red-400 mt-1">
                Confidence: {Math.round(alert.confidence * 100)}%
              </p>
            )}
            {saving && <p className="text-xs text-orange-500 mt-1">Saving clip…</p>}
          </div>
          <button
            onClick={() => { setAlert(null); video.clearAlert(); }}
            className="text-red-400 hover:text-red-600 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hidden canvas for AI frame capture */}
      <canvas ref={commentaryCanvasRef} style={{ display: 'none' }} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Video feed */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Video size={15} /> Camera Feed
            </p>
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <video
              ref={video.videoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* DEMO FALLBACK — commented out for live device testing
            {!monitoring && (
              <video
                src="/trustpaws/demo-cam.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            */}
            {/* Motion level overlay */}
            {monitoring && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/70 text-xs">Motion</span>
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-100 ${
                        video.motionLevel > 70 ? 'bg-red-400' :
                        video.motionLevel > 40 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${video.motionLevel}%` }}
                    />
                  </div>
                  <span className="text-white/70 text-xs w-8 text-right">
                    {Math.round(video.motionLevel)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {video.alertReason && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle size={12} /> {video.alertReason}
            </p>
          )}
        </div>

        {/* Audio panel */}
        <div className="card space-y-3">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Mic size={15} /> Audio Monitor
          </p>

          {/* Volume bar */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Overall Volume</span>
                <span>{Math.round(audio.volume)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    audio.volume > 75 ? 'bg-red-400' :
                    audio.volume > 45 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${audio.volume}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Distress Frequency Band</span>
                <span>{Math.round(audio.highFreqLevel)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    audio.highFreqLevel > 70 ? 'bg-red-500' :
                    audio.highFreqLevel > 40 ? 'bg-orange-400' : 'bg-brand-400'
                  }`}
                  style={{ width: `${audio.highFreqLevel}%` }}
                />
              </div>
            </div>

            {/* Visual waveform bars */}
            <div className="flex items-end justify-center gap-0.5 h-12 bg-gray-50 rounded-lg px-2">
              {Array.from({ length: 28 }).map((_, i) => {
                const t  = Date.now() / 200 + i * 0.6;
                const h  = monitoring
                  ? Math.max(4, audio.volume * 0.4 * (0.5 + 0.5 * Math.sin(t)))
                  : 4;
                return (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                      audio.volume > 75 ? 'bg-red-400' :
                      audio.volume > 45 ? 'bg-yellow-400' : 'bg-brand-400'
                    }`}
                    style={{ height: `${h}px` }}
                  />
                );
              })}
            </div>
          </div>

          {audio.alertReason && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle size={12} /> {audio.alertReason}
            </p>
          )}

          {!monitoring && (
            <p className="text-xs text-gray-400 text-center py-2">
              <MicOff size={14} className="inline mr-1" />
              Microphone inactive
            </p>
          )}
        </div>
      </div>

      {/* Session Updates panel */}
      <div className="card bg-gray-900 border border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-200 flex items-center gap-2">
            <Bot size={15} className="text-brand-400" /> Session Updates
          </p>
          <div className="flex items-center gap-2">
            {analyzing && (
              <span className="text-xs text-gray-400 animate-pulse">Analyzing…</span>
            )}
            {monitoring && !analyzing && (
              <button
                onClick={runCommentary}
                className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2"
              >
                Analyze now
              </button>
            )}
          </div>
        </div>

        {sessionUpdates.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            {monitoring
              ? 'First update in a few seconds…'
              : 'Start monitoring to receive AI commentary.'}
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {sessionUpdates.map((u, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-gray-500 shrink-0 font-mono text-xs pt-0.5">{u.time}</span>
                <p className="text-gray-200 leading-snug">{u.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detection info */}
      <div className="card">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">What TrustPaws listens for</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Sudden yelp',      icon: '😣', desc: 'Sharp amplitude spike' },
            { label: 'Whimper / howl',   icon: '😢', desc: 'Sustained high-freq sound' },
            { label: 'Sudden flinch',    icon: '⚡', desc: 'Rapid motion change' },
            { label: 'Recoil movement',  icon: '🐾', desc: 'Frame diff spike' },
          ].map(({ label, icon, desc }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!monitoring ? (
          <button onClick={startMonitoring} className="btn-primary flex items-center gap-2 flex-1 justify-center">
            <Video size={16} /> Start Monitoring
          </button>
        ) : (
          <>
            <button onClick={stopMonitoring} className="btn-secondary flex items-center gap-2 flex-1 justify-center">
              <VideoOff size={16} /> Stop
            </button>
            <button
              onClick={saveManualClip}
              disabled={saving}
              className="btn-primary flex items-center gap-2 flex-1 justify-center"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Video size={16} />}
              {saving ? 'Saving…' : 'Save Clip Now'}
            </button>
          </>
        )}
      </div>

      {/* Clips list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Recorded Clips</h2>
          <button onClick={loadClips} className="text-gray-400 hover:text-gray-600">
            <RefreshCw size={16} />
          </button>
        </div>

        {clips.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            No clips recorded yet
          </div>
        ) : (
          <div className="space-y-2">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className={`card flex items-start gap-3 ${!clip.reviewed ? 'border-l-4 border-red-400' : ''}`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  clip.triggerType === 'AUDIO_DISTRESS' ? 'bg-orange-100 text-orange-600' :
                  clip.triggerType === 'MOTION_SPIKE'   ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {clip.triggerType === 'AUDIO_DISTRESS' ? <Mic size={16} /> :
                   clip.triggerType === 'MOTION_SPIKE'   ? <Video size={16} /> :
                   <Video size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {clip.triggerType === 'AUDIO_DISTRESS' ? 'Audio Distress' :
                       clip.triggerType === 'MOTION_SPIKE'   ? 'Motion Spike' : 'Manual'}
                    </span>
                    {!clip.reviewed && (
                      <span className="badge bg-red-100 text-red-600">Needs review</span>
                    )}
                    {clip.confidence != null && (
                      <span className="badge bg-gray-100 text-gray-600">
                        {Math.round(clip.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(clip.createdAt), 'h:mm a · MMM d')}
                    {clip.durationSec && ` · ${clip.durationSec}s`}
                  </p>
                  {/* Video player */}
                  <video
                    src={clip.url}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="mt-2 w-full rounded-lg max-h-48 bg-black"
                    onError={(e) => { e.target.src = '/trustpaws/demo-cam.mp4'; }}
                  />
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!clip.reviewed && (
                    <button
                      onClick={() => markReviewed(clip.id)}
                      className="text-green-500 hover:text-green-700"
                      title="Mark reviewed"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  {clip.reviewed && <CheckCircle size={16} className="text-green-400" />}
                  <button
                    onClick={() => deleteClip(clip.id)}
                    className="text-red-400 hover:text-red-600"
                    title="Delete clip"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
