import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Square, BookOpen, Mic, LogOut } from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import './Interview.css';

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'right'];
const READ_TIME = 30;    // seconds
const RECORD_TIME = 120; // seconds
const BEEP_AT = 10;      // seconds remaining for beep

export default function Interview() {
  const navigate = useNavigate();

  // Session data from sessionStorage
  const session = JSON.parse(sessionStorage.getItem('mv_session') || 'null');
  const questions = JSON.parse(sessionStorage.getItem('mv_questions') || '[]');
  const qIndex = parseInt(sessionStorage.getItem('mv_q_index') || '0');
  const question = questions[qIndex];


  const smallVideoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const readTimerRef = useRef(null);
  const recTimerRef = useRef(null);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(null);
  const audioChunksRef = useRef([]);
  const finalTranscriptRef = useRef('');
  const beepedRef = useRef(false);
  const pauseStartRef = useRef(null);
  const isRecordingRef = useRef(false); // Ref to track recording state without stale closure
  const hasNavigatedRef = useRef(false); // Guard against StrictMode double-navigate

  const [phase, setPhase] = useState('reading'); // 'reading' | 'recording' | 'done'
  const [readTimeLeft, setReadTimeLeft] = useState(READ_TIME);
  const [recTimeLeft, setRecTimeLeft] = useState(RECORD_TIME);

  // Live tracking state
  const transcriptRef = useRef('');
  const fillerBreakdownRef = useRef({});
  const fillerCountRef = useRef(0);
  const gazeFramesRef = useRef({ looking: 0, total: 0 });
  const pauseCountRef = useRef(0);
  const wordCountRef = useRef(0);

  const [wpm, setWpm] = useState(0);
  const [ , setTranscript ] = useState('');

  // Modal state
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const hasFinishedRef = useRef(false);

  // Redirect if no session data
  useEffect(() => {
    if ((!session || !question) && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      navigate('/setup');
    }
  }, [session, question, navigate]);



  const playBeep = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* ignore */ }
  };

  const stopRecording = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    
    setPhase('done');
    isRecordingRef.current = false; // Mark recording stopped before cleanup

    // Stop all intervals
    clearInterval(recTimerRef.current);
    clearInterval(readTimerRef.current);
    clearInterval(faceIntervalRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const doFinish = () => {
      // Stop streams to turn off camera light
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Final WPM
      const elapsed = (Date.now() - startTimeRef.current) / 60000;
      const finalWpm = elapsed > 0 ? Math.round(wordCountRef.current / elapsed) : 0;
      const gazePercent = gazeFramesRef.current.total > 0
        ? (gazeFramesRef.current.looking / gazeFramesRef.current.total) * 100
        : 0;

      // Attach to window so Processing can grab it
      if (audioChunksRef.current && audioChunksRef.current.length > 0) {
        window.mv_audio_blob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
        });
      } else {
        window.mv_audio_blob = null;
      }

      // Store analytics for Processing page
      const analytics = {
        transcript: transcriptRef.current,
        filler_word_breakdown: fillerBreakdownRef.current,
        filler_word_count: fillerCountRef.current,
        speaking_pace: finalWpm,
        pause_count: pauseCountRef.current,
        gaze_percentage: Math.round(gazePercent),
      };

      sessionStorage.setItem('mv_analytics', JSON.stringify(analytics));
      navigate('/processing');
    };
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = doFinish;
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        doFinish();
      }
    } else {
      doFinish();
    }
  }, [navigate]);

  const handleExit = () => {
    setIsExitModalOpen(true);
  };

  const confirmExit = async () => {
    // Stop everything
    stopAll();
    
    try {
      if (qIndex === 0) {
        // Disqualify: Delete session if exiting on 1st question
        await api.delete(`/sessions/${session.id}`);
      } else {
        // Mark session as complete (backend will compute average of current answers)
        await api.patch(`/sessions/${session.id}/complete`);
      }
    } catch (err) {
      console.warn("Interview: exit processing failed", err);
    }
    
    navigate('/dashboard');
  };

  const startRecordingPhase = useCallback(() => {
    try {
      // Clear any existing
      if (recTimerRef.current) clearInterval(recTimerRef.current);

      setPhase('recording');
      isRecordingRef.current = true;
      setRecTimeLeft(RECORD_TIME);
      startTimeRef.current = Date.now();

      // ── MediaRecorder ──────────────────────────
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'; 
      }
      const audioStream = new MediaStream(streamRef.current.getAudioTracks());
      const recorder = new MediaRecorder(audioStream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();

      // ── Web Speech API ─────────────────────────
      startSpeechRecognition();

      // ── face-api.js gaze detection ─────────────
      startGazeDetection();

      // ── Recording timer ─────────────────────────
      recTimerRef.current = setInterval(() => {
        setRecTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        
        // Update WPM live every second (outside the React updater function)
        const elapsed = (Date.now() - startTimeRef.current) / 60000;
        if (elapsed > 0 && wordCountRef.current != null) {
          setWpm(Math.round(wordCountRef.current / elapsed));
        }
      }, 1000);
    } catch (err) {
      console.error("Interview: startRecordingPhase crashed", err);
      // Fallback: forcefully advance if we hard crash
      stopRecording();
    }
  }, [stopRecording]);

  const startReadingPhase = useCallback(() => {
    // Clear any existing
    if (readTimerRef.current) clearInterval(readTimerRef.current);
    
    setPhase('reading');
    setReadTimeLeft(READ_TIME);
    beepedRef.current = false;

    readTimerRef.current = setInterval(() => {
      setReadTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  }, []);

  // ── Phase Observers to handle side-effects safely out of React updaters ──
  useEffect(() => {
    if (phase === 'reading' && readTimeLeft === 0) {
      if (readTimerRef.current) clearInterval(readTimerRef.current);
      startRecordingPhase();
    }
  }, [phase, readTimeLeft, startRecordingPhase]);

  useEffect(() => {
    if (phase === 'recording' && recTimeLeft === 0) {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      stopRecording();
    }
  }, [phase, recTimeLeft, stopRecording]);

  useEffect(() => {
    if (phase === 'reading' && readTimeLeft === BEEP_AT && !beepedRef.current) {
      beepedRef.current = true;
      playBeep();
    }
  }, [phase, readTimeLeft]);



  const startSpeechRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;

      let silenceTimer = null;

      recognition.onresult = (e) => {
        // Reset silence timer
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (pauseStartRef.current === null) {
            pauseStartRef.current = Date.now();
          }
        }, 3000);

        let interimTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            finalTranscriptRef.current += e.results[i][0].transcript + ' ';
          } else {
            interimTranscript += e.results[i][0].transcript + ' ';
          }
        }
        
        const combined = (finalTranscriptRef.current + interimTranscript).trim();
        transcriptRef.current = combined;
        setTranscript(combined);

        // Word count
        wordCountRef.current = combined.split(/\s+/).filter(Boolean).length;

        // Detect end of pause
        if (pauseStartRef.current !== null) {
          const pauseLen = (Date.now() - pauseStartRef.current) / 1000;
          if (pauseLen >= 3) { pauseCountRef.current += 1; }
          pauseStartRef.current = null;
        }

        // Filler word detection
        const lower = combined.toLowerCase();
        const breakdown = {};
        let totalFillers = 0;
        FILLER_WORDS.forEach((fw) => {
          const matches = (lower.match(new RegExp(`\\b${fw}\\b`, 'g')) || []).length;
          if (matches > 0) { breakdown[fw] = matches; totalFillers += matches; }
        });
        fillerBreakdownRef.current = breakdown;
        fillerCountRef.current = totalFillers;
      };

      recognition.onerror = (e) => console.warn('Speech recognition error:', e.error);
      recognition.onend = () => {
        // Restart if still recording — use ref to avoid stale closure
        if (isRecordingRef.current) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition startup failed', err);
    }
  };

  const startGazeDetection = () => {
    const video = smallVideoRef.current;
    if (!video) return;

    // Use a clearer interval for tracking (e.g. 500ms)
    faceIntervalRef.current = setInterval(async () => {
      // Logic: If models aren't ready or video isn't actually data-ready, skip this frame
      if (!faceapi.nets.tinyFaceDetector.isLoaded) return;
      if (video.readyState !== 4) return; // 4 = HAVE_ENOUGH_DATA

      // We only reach this if the hardware is actually and truly "producing" pixels
      gazeFramesRef.current.total++;

      try {
        const detection = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 })
        );

        if (detection) {
          gazeFramesRef.current.looking++;
        }
      } catch (e) {
        // Silently skip if detection engine itself hits a buffer error
      }
    }, 500);
  };



  const stopAll = () => {
    clearInterval(recTimerRef.current);
    clearInterval(readTimerRef.current);
    clearInterval(faceIntervalRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const readProgress = ((READ_TIME - readTimeLeft) / READ_TIME) * 100;
  const recProgress = ((RECORD_TIME - recTimeLeft) / RECORD_TIME) * 100;

  // Start hardware initialization
  useEffect(() => {
    let isCurrent = true;

    const initHardware = async () => {
      try {
        // PROBE FIRST to wake up hardware in Safari/Mac
        let probe = null;
        try {
          probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (probeErr) {
          console.warn('Interview probe fallback:', probeErr);
          probe = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (!isCurrent) {
          if (probe) probe.getTracks().forEach(t => t.stop());
          return;
        }

        const prefVideoId = sessionStorage.getItem('mv_deviceId_video');
        const prefAudioId = sessionStorage.getItem('mv_deviceId_audio');

        const constraints = {
          video: prefVideoId ? { deviceId: { ideal: prefVideoId } } : true,
          audio: prefAudioId ? { deviceId: { ideal: prefAudioId } } : true
        };

        let stream;
        try {
          // Only request preferred if we actually have specific preferences
          if (prefVideoId || prefAudioId) {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (probe) probe.getTracks().forEach(t => t.stop()); // Clean up probe
          } else {
            stream = probe; // Use generic probe since no preferences exist
          }
        } catch (e) {
          console.warn('Interview: Preferred hardware failed, falling back to probe...', e.message);
          stream = probe; // Use the probe as last resort
        }

        if (!isCurrent) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (smallVideoRef.current) {
          smallVideoRef.current.srcObject = stream;
        }

        // Just in case user navigated directly, make sure models are loaded
        const MODEL_URL = '/models';
        if (!faceapi.nets.tinyFaceDetector.isLoaded || !faceapi.nets.faceLandmark68TinyNet.isLoaded) {
          try {
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            ]);
          } catch (modelErr) {
            console.warn('Interview: Models failed to load silently', modelErr);
          }
        }

        if (!isCurrent) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        // Only begin the interview rounds if hardware is active
        startReadingPhase();
      } catch (e) {
        if (isCurrent) {
          console.error('Interview: Critical hardware failure:', e);
          alert(`Could not access camera/mic: ${e.message}. Moving to check page.`);
          navigate('/check');
        }
      }
    };

    initHardware();

    return () => {
      isCurrent = false;
      stopAll();
    };
  }, []);

  if (!question) return null;

  return (
    <div className="interview-page">
      <div className="mesh-bg" />

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="interview-topbar">
        <div className="it-left">
          <button className="exit-btn" onClick={handleExit} title="Exit to Dashboard">
            <LogOut size={14} />
            <span>Exit Interview</span>
          </button>
        </div>

        <div className="it-center">
          <div className="mv-logo-small">MockVue</div>
          {phase === 'recording' && (
            <div className="rec-indicator">
              <span className="rec-dot" />
              Recording
            </div>
          )}
          {phase === 'reading' && (
            <div className="read-indicator">
              <BookOpen size={13} />
              Reading time
            </div>
          )}
        </div>

        <div className="it-right">
          <div className="timer-display">
            {phase === 'reading'
              ? <span style={{ color: readTimeLeft <= 10 ? 'var(--warning)' : 'var(--text-primary)' }}>
                  {formatTime(readTimeLeft)}
                </span>
              : <span style={{ color: recTimeLeft <= 30 ? 'var(--warning)' : 'var(--text-primary)' }}>
                  {formatTime(recTimeLeft)}
                </span>
            }
          </div>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div className="progress-bar-wrap" style={{ borderRadius: 0 }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${phase === 'reading' ? readProgress : recProgress}%`,
            background: phase === 'reading' ? 'var(--accent-gradient)' : 'linear-gradient(90deg, var(--danger) 0%, var(--warning) 100%)',
          }}
        />
      </div>

      {/* ── Question ──────────────────────────────────────────────────────── */}
      <div className="question-area">
        <div className="question-meta">
          Question {qIndex + 1} of {questions.length} · {session?.company} · {session?.role}
        </div>
        <h1 className="question-text">{question.question_text}</h1>

        {phase === 'reading' && (
          <div className="reading-hint animate-fadeIn">
            <span>Take a moment to gather your thoughts. Recording starts in{' '}
              <strong style={{ color: readTimeLeft <= 10 ? 'var(--warning)' : 'inherit' }}>
                {readTimeLeft}s
              </strong>
            </span>
          </div>
        )}

        {phase === 'recording' && (
          <div className="recording-hint animate-fadeIn">
            <Mic size={13} />
            <span>Speak clearly and look at your camera</span>
          </div>
        )}
      </div>

      {/* ── Live camera (bottom left) ──────────────────────────────────────── */}
      <div className="live-cam-wrap">
        <video
          ref={smallVideoRef}
          autoPlay
          muted
          playsInline
          className="live-cam-video"
        />
        {phase === 'recording' && wpm > 0 && (
          <div className="wpm-badge">{wpm} WPM</div>
        )}
      </div>

      {/* ── Stop button ───────────────────────────────────────────────────── */}
      {phase === 'recording' && (
        <div className="stop-btn-wrap">
          <button
            id="stop-recording"
            className="btn btn-danger"
            onClick={stopRecording}
          >
            <Square size={14} fill="currentColor" />
            Stop Recording
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isExitModalOpen}
        title="Exit Interview?"
        message={qIndex === 0 
          ? "Exiting on the first question will disqualify this session. It will not be saved to your history."
          : "Are you sure you want to exit? Your session will end here and a report will be generated for the questions you've already answered."
        }
        confirmText="Exit Interview"
        variant="danger"
        onConfirm={confirmExit}
        onCancel={() => setIsExitModalOpen(false)}
      />
    </div>
  );
}
