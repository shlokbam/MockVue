import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import Navbar from '../components/Navbar';
import { Camera, Mic, Eye, Lightbulb, CameraOff, ChevronRight, Check, Settings } from 'lucide-react';
import './CameraCheck.css';

export default function CameraCheck() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsReady, setModelsReady] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState('');
  const [micError, setMicError] = useState('');

  // Device Selection State
  const [devices, setDevices] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const init = async () => {
      // Step 1: Probe for basic permissions (PROBE FIRST)
      const stream = await probeHardware(isCurrent);
      if (!isCurrent || !stream) return;

      // Step 2: Once permissions are granted, we can see device labels
      await updateDevices();
      if (!isCurrent) return;

      // Step 3: Load AI models
      await loadModels(isCurrent);
    };

    init();
    
    const deviceChangeHandler = () => updateDevices();
    navigator.mediaDevices.addEventListener('devicechange', deviceChangeHandler);

    return () => {
      isCurrent = false;
      navigator.mediaDevices.removeEventListener('devicechange', deviceChangeHandler);
      cleanupHardware();
    };
  }, []);

  // Sync hardware when selection changes manually
  useEffect(() => {
    if (selectedVideoId || selectedAudioId) {
      startCamera();
    }
  }, [selectedVideoId, selectedAudioId]);

  const cleanupHardware = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const probeHardware = async (isCurrent) => {
    try {
      setError('');
      setMicError('');
      console.log('CameraCheck: Probing hardware...');

      let stream;
      try {
        // Attempt 1: Combined request
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (probeErr) {
        console.warn('CameraCheck: Combined probe failed, trying split probe...', probeErr.message);
        
        // Attempt 2: Split request (Video first, then Audio)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.addTrack(audioStream.getAudioTracks()[0]);
        } catch (audioErr) {
          console.warn('CameraCheck: Default audio failed, trying raw audio...', audioErr.message);
          try {
            // Attempt 3: Raw audio (bypasses some strict macOS CoreAudio constraints)
            const rawAudio = await navigator.mediaDevices.getUserMedia({ 
              audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
            });
            stream.addTrack(rawAudio.getAudioTracks()[0]);
          } catch (rawAudioErr) {
            throw { name: rawAudioErr.name, message: rawAudioErr.message, stream }; // Pass the video stream up for fallback
          }
        }
      }

      if (!isCurrent) {
        stream.getTracks().forEach(t => t.stop());
        return null;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraReady(true);
      setupMicAnalyser(stream);
      return stream;

    } catch (e) {
      // If we made it here with a video `stream` object attached to the error, video works but audio totally failed.
      if (e.stream) {
        const videoStream = e.stream;
        if (!isCurrent) {
          videoStream.getTracks().forEach(t => t.stop());
          return null;
        }
        streamRef.current = videoStream;
        if (videoRef.current) videoRef.current.srcObject = videoStream;
        setCameraReady(true);
        setMicError(`Microphone access failed: ${e.name} - ${e.message}. Using video only.`);
        return videoStream;
      }

      // If video ALSO failed
      if (isCurrent) {
        setError(`Hardware access failed: ${e.message}`);
      }
      return null;
    }
  };

  const updateDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      console.log('Devices enumerated:', allDevices);
      setDevices(allDevices);
      
      const videoIn = allDevices.filter(d => d.kind === 'videoinput');
      const audioIn = allDevices.filter(d => d.kind === 'audioinput');
      
      // Sync selection with currently active tracks if not already set
      if (streamRef.current) {
        const activeVideoTrack = streamRef.current.getVideoTracks()[0];
        const activeAudioTrack = streamRef.current.getAudioTracks()[0];
        
        if (activeVideoTrack && !selectedVideoId) {
          setSelectedVideoId(activeVideoTrack.getSettings().deviceId || videoIn[0]?.deviceId);
        }
        if (activeAudioTrack && !selectedAudioId) {
          setSelectedAudioId(activeAudioTrack.getSettings().deviceId || audioIn[0]?.deviceId);
        }
      }
    } catch (e) {
      console.error('Update devices failed:', e);
    }
  };

  const handleRefreshDevices = async () => {
    setError('');
    const s = await probeHardware(true);
    if (s) await updateDevices();
  };

  const startCamera = async (isCurrent = true) => {
    // This is called when the user MANUALLY changes a device in the dropdown
    try {
      cleanupHardware();

      const constraints = {
        video: selectedVideoId ? { deviceId: { ideal: selectedVideoId } } : true,
        audio: selectedAudioId ? { deviceId: { ideal: selectedAudioId } } : true
      };

      console.log('CameraCheck: Switching to selected hardware...', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!isCurrent) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraReady(true);
      setupMicAnalyser(stream);
      setError('');
      setMicError('');

      // Save choices for interview
      sessionStorage.setItem('mv_deviceId_video', selectedVideoId);
      sessionStorage.setItem('mv_deviceId_audio', selectedAudioId);
      
    } catch (e) {
      console.error('CameraCheck: Switch failed, falling back...', e.message);
      // Last resort: just get anything
      await probeHardware(isCurrent);
    }
  };

  const setupMicAnalyser = (stream) => {
    if (analyserRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setMicReady(false);
      return;
    }
    
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let hasDetectedSound = false;

      const tick = () => {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        
        // Increased multiplier from 2.5 to 4.0 for better visual responsiveness
        setMicLevel(Math.min(100, avg * 4.0)); 
        
        if (avg > 3 && !hasDetectedSound) {
          hasDetectedSound = true;
          setMicReady(true);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
      // Auto-ready after 1.5s even if no sound (just to enable button if mic is quiet)
      setTimeout(() => setMicReady(true), 1500); 
    } catch (e) {
      console.warn('Mic analyser failed:', e);
      setMicReady(true); // Don't block the user if only the visualizer fails
    }
  };

  const loadModels = async (isCurrent = true) => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ]);
      if (isCurrent) setModelsReady(true);
    } catch (e) {
      if (isCurrent) {
        console.warn('face-api.js models not found:', e);
        setModelsReady(true);
      }
    } finally {
      if (isCurrent) setModelsLoading(false);
    }
  };

  const handleStart = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    cancelAnimationFrame(animFrameRef.current);
    navigate('/interview');
  };

  const canStart = cameraReady && modelsReady;

  const videoMics = devices.filter(d => d.kind === 'videoinput');
  const audioMics = devices.filter(d => d.kind === 'audioinput');

  return (
    <div className="page">
      <div className="mesh-bg" />
      <Navbar />

      <div className="check-wrap">
        <div className="check-header animate-fadeInUp">
          <h1>Device Check</h1>
          <p>Verify your camera and microphone before the session begins</p>
        </div>

        <div className="check-layout animate-fadeInUp">
          {/* Camera Preview */}
          <div className="cam-preview-wrap">
            {error ? (
              <div className="cam-error">
                <CameraOff size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <p style={{ marginBottom: 16 }}>{error}</p>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => {
                    setError('');
                    handleRefreshDevices();
                  }}
                >
                  Retry Access
                </button>
                <button 
                  className="btn btn-ghost btn-sm" 
                  style={{ marginTop: 8, fontSize: '11px', opacity: 0.6 }}
                  onClick={handleRefreshDevices}
                >
                  Refresh Devices list
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="cam-preview"
              />
            )}

            {modelsLoading && (
              <div className="cam-overlay">
                <div className="spinner" style={{ width: 14, height: 14 }} />
                <span>Loading AI models...</span>
              </div>
            )}
          </div>

          {/* Checklist & Settings */}
          <div className="check-panel">
            <div className={`check-card glass ${cameraReady ? 'done' : ''}`}>
               <div className="check-item-head">
                 <div className={`check-indicator ${cameraReady ? 'ready' : 'waiting'}`}>
                    {cameraReady ? <Check size={14} strokeWidth={2.5} /> : <Camera size={14} />}
                 </div>
                 <div className="check-label-group">
                   <div className="check-label">Camera</div>
                   <div className="check-sub">{cameraReady ? 'Camera detected' : 'Waiting for access...'}</div>
                 </div>
               </div>
               
               <div className="device-select-wrap">
                 <select 
                   value={selectedVideoId} 
                   onChange={(e) => setSelectedVideoId(e.target.value)}
                   className="device-select"
                 >
                   {videoMics.map(d => (
                     <option key={d.deviceId} value={d.deviceId}>
                       {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                     </option>
                   ))}
                   {videoMics.length === 0 && <option>No cameras found</option>}
                 </select>
               </div>
            </div>

            <div className={`check-card glass ${micReady ? 'done' : ''}`}>
               <div className="check-item-head">
                 <div className={`check-indicator ${micReady ? 'ready' : 'waiting'}`}>
                    {micReady ? <Check size={14} strokeWidth={2.5} /> : <Mic size={14} />}
                 </div>
                 <div className="check-label-group">
                   <div className="check-label">Microphone</div>
                   <div className="check-sub">{micReady ? 'Microphone detected' : 'Waiting for access...'}</div>
                 </div>
                 <div className="mic-meter-mini">
                    <div className="mic-meter-fill" style={{ width: `${micLevel}%` }} />
                 </div>
               </div>
               
               <div className="device-select-wrap">
                 <select 
                   value={selectedAudioId} 
                   onChange={(e) => setSelectedAudioId(e.target.value)}
                   className="device-select"
                 >
                   {audioMics.map(d => (
                     <option key={d.deviceId} value={d.deviceId}>
                       {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                     </option>
                   ))}
                   {audioMics.length === 0 && <option value="">No microphones found</option>}
                 </select>
                 <button 
                   className="btn btn-ghost btn-xs" 
                   style={{ marginTop: 6, fontSize: '10px', width: '100%', opacity: 0.5 }}
                   onClick={handleRefreshDevices}
                 >
                   Rescan for Microphones
                 </button>
               </div>
               {micError && <div className="mic-error-msg">{micError}</div>}
            </div>

            <div className={`check-card glass ${modelsReady ? 'done' : ''}`}>
               <div className="check-item-head">
                 <div className={`check-indicator ${modelsReady ? 'ready' : 'waiting'}`}>
                    {modelsReady ? <Check size={14} strokeWidth={2.5} /> : <Eye size={14} />}
                 </div>
                 <div className="check-label-group">
                   <div className="check-label">AI Eye Tracking</div>
                   <div className="check-sub">{modelsReady ? 'Tracking active' : 'Loading models...'}</div>
                 </div>
               </div>
            </div>

            <div className="check-tips glass">
              <div className="tip-header">
                <Lightbulb size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="tip-title">Pro Tip</span>
              </div>
              <p>Close other apps (Zoom, WhatsApp) that might be using your microphone.</p>
            </div>

            <button
              id="start-interview-btn"
              className="btn btn-primary btn-lg"
              onClick={handleStart}
              disabled={!canStart}
              style={{ width: '100%', marginTop: 'auto' }}
            >
              Start Interview <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
