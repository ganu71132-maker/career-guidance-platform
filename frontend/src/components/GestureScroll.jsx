import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Sparkles, HelpCircle, Settings, Eye, EyeOff, Hand, Navigation } from 'lucide-react';

export default function GestureScroll() {
  const [isActive, setIsActive] = useState(false);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isPinched, setIsPinched] = useState(false);
  const [isCameraPaused, setIsCameraPaused] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // User Configurable Settings
  const [pinchSensitivity, setPinchSensitivity] = useState(6); // 1 to 10 scale (maps to 0.03 to 0.12 distance)
  const [scrollSpeed, setScrollSpeed] = useState(3000); // multiplier

  // Refs for resolving stale closures inside the MediaPipe callback
  const isActiveRef = useRef(isActive);
  const isCameraPausedRef = useRef(isCameraPaused);
  const pinchSensitivityRef = useRef(pinchSensitivity);
  const scrollSpeedRef = useRef(scrollSpeed);
  const isHandDetectedRef = useRef(isHandDetected);
  const isPinchedRef = useRef(isPinched);

  const videoRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const lastHandDetectedTime = useRef(Date.now());
  const animationFrameRef = useRef(null);

  // Pinch Drag State
  const pinchStartYRef = useRef(null);
  const initialScrollYRef = useRef(0);
  const smoothedWristYRef = useRef(null);

  // Update refs when state changes
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isCameraPausedRef.current = isCameraPaused; }, [isCameraPaused]);
  useEffect(() => { pinchSensitivityRef.current = pinchSensitivity; }, [pinchSensitivity]);
  useEffect(() => { scrollSpeedRef.current = scrollSpeed; }, [scrollSpeed]);

  // Initialize and check MediaPipe Hands
  useEffect(() => {
    let checkInterval = setInterval(() => {
      if (window.Hands && window.Camera) {
        clearInterval(checkInterval);
        setCameraConnected(true);
      }
    }, 500);

    return () => {
      clearInterval(checkInterval);
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle inactivity timeout (60 seconds)
  useEffect(() => {
    if (!isActive || isCameraPaused) return;

    const interval = setInterval(() => {
      if (Date.now() - lastHandDetectedTime.current > 60000) {
        setIsCameraPaused(true);
        if (cameraRef.current) {
          cameraRef.current.stop();
        }
        setIsHandDetected(false);
        isHandDetectedRef.current = false;
        setIsPinched(false);
        isPinchedRef.current = false;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isCameraPaused]);

  // Turn on/off gesture control
  const toggleGestureControl = async () => {
    if (isActive) {
      // Turn Off
      setIsActive(false);
      setIsHandDetected(false);
      isHandDetectedRef.current = false;
      setIsPinched(false);
      isPinchedRef.current = false;
      setIsCameraPaused(false);
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    } else {
      // Turn On
      setIsActive(true);
      setIsCameraPaused(false);
      lastHandDetectedTime.current = Date.now();
      setTimeout(() => {
        initMediaPipe();
      }, 300);
    }
  };

  const resumeCamera = () => {
    setIsCameraPaused(false);
    lastHandDetectedTime.current = Date.now();
    setTimeout(() => {
      initMediaPipe();
    }, 100);
  };

  const initMediaPipe = () => {
    if (!window.Hands || !window.Camera || !videoRef.current) return;

    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0, // 0 is much faster and lighter for mobile devices
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && !isCameraPausedRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 256,  // Lower resolution means faster processing
      height: 144
    });

    camera.start()
      .then(() => setCameraConnected(true))
      .catch((err) => {
        console.error("Failed to start camera:", err);
        setCameraConnected(false);
        setIsActive(false);
      });

    cameraRef.current = camera;
  };

  const onResults = (results) => {
    if (!isActiveRef.current || isCameraPausedRef.current) return;

    const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
    
    if (hasHand !== isHandDetectedRef.current) {
      isHandDetectedRef.current = hasHand;
      setIsHandDetected(hasHand);
    }

    if (hasHand) {
      lastHandDetectedTime.current = Date.now();
      
      const landmarks = results.multiHandLandmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const wrist = landmarks[0];

      // Calculate distance between thumb tip and index tip
      const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
      
      // Map user sensitivity (1-10) to distance threshold (0.03 to 0.12)
      // Higher sensitivity = easier to pinch (larger threshold)
      const pinchThreshold = 0.03 + (pinchSensitivityRef.current / 10) * 0.09;

      const currentlyPinched = distance < pinchThreshold;

      if (currentlyPinched !== isPinchedRef.current) {
        isPinchedRef.current = currentlyPinched;
        setIsPinched(currentlyPinched);
      }

      // Smooth wrist Y coordinate for stable dragging
      if (smoothedWristYRef.current === null) {
        smoothedWristYRef.current = wrist.y;
      } else {
        smoothedWristYRef.current = smoothedWristYRef.current * 0.6 + wrist.y * 0.4;
      }

      if (currentlyPinched) {
        if (pinchStartYRef.current === null) {
          // Just grabbed! Record starting positions
          pinchStartYRef.current = smoothedWristYRef.current;
          initialScrollYRef.current = window.scrollY;
        } else {
          // Dragging
          const deltaY = smoothedWristYRef.current - pinchStartYRef.current;
          
          // Natural Scrolling: Moving hand UP (negative delta) pushes page UP (scroll down)
          const targetScrollY = initialScrollYRef.current - (deltaY * scrollSpeedRef.current);
          
          window.scrollTo({
            top: targetScrollY,
            behavior: 'auto' // 'auto' feels better for direct mapping than 'smooth'
          });
        }
      } else {
        // Hand is open, reset grab anchors
        pinchStartYRef.current = null;
      }

    } else {
      // No hand
      if (isPinchedRef.current) {
        isPinchedRef.current = false;
        setIsPinched(false);
      }
      pinchStartYRef.current = null;
      smoothedWristYRef.current = null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end gap-2 sm:gap-3 font-sans pointer-events-none">
      {/* Floating Webcam & Status Panel */}
      {isActive && (
        <div className="w-52 sm:w-72 overflow-hidden rounded-xl sm:rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700/60 backdrop-blur-md transition-all duration-300 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-700/40">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide">Pinch to Scroll</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button 
                onClick={() => setShowPreview(!showPreview)} 
                className="rounded-md p-1 hover:bg-slate-700/60 transition-colors"
              >
                {showPreview ? <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className="rounded-md p-1 hover:bg-slate-700/60 transition-colors"
              >
                <Settings className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${showSettings ? 'text-emerald-400' : ''}`} />
              </button>
              <button 
                onClick={() => setShowInstructions(!showInstructions)} 
                className="rounded-md p-1 hover:bg-slate-700/60 transition-colors"
              >
                <HelpCircle className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${showInstructions ? 'text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Settings Section */}
          {showSettings && (
            <div className="p-3 sm:p-4 bg-slate-800/50 border-b border-slate-700/40 text-[10px] sm:text-xs flex flex-col gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Pinch Sensitivity:</span>
                  <span className="text-emerald-400 font-mono">{pinchSensitivity}/10</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={pinchSensitivity} 
                  onChange={(e) => setPinchSensitivity(Number(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Scroll Speed:</span>
                  <span className="text-emerald-400 font-mono">{scrollSpeed}</span>
                </div>
                <input 
                  type="range" min="1000" max="6000" step="500"
                  value={scrollSpeed} 
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                />
              </div>
            </div>
          )}

          {/* Video Preview */}
          {showPreview && !isCameraPaused && (
            <div className="relative aspect-video w-full bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-cover scale-x-[-1]"
                playsInline
                muted
                autoPlay
              />
              {/* Feedback Overlay */}
              {isHandDetected && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-colors duration-200 ${isPinched ? 'bg-emerald-500/30' : 'bg-transparent'}`}>
                  {isPinched ? (
                    <>
                      <Navigation className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400 drop-shadow-lg" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 mt-1 sm:mt-2 drop-shadow-md">Grabbing Page</span>
                    </>
                  ) : (
                    <Hand className="h-6 w-6 sm:h-8 sm:w-8 text-white/40 drop-shadow-lg opacity-50" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Paused State */}
          {isCameraPaused && (
            <div className="aspect-video w-full bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 text-center">
              <CameraOff className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 mb-2" />
              <p className="text-[10px] sm:text-xs font-medium text-slate-300">No hand detected.</p>
              <button 
                onClick={resumeCamera}
                className="mt-2 sm:mt-3 px-2 py-1 sm:px-3 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs font-semibold shadow transition-colors"
              >
                Resume Camera
              </button>
            </div>
          )}

          {/* Status & Instructions */}
          <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
            <div className="flex flex-col gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Camera Connected</span>
                <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${cameraConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-500'}`} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hand Detected</span>
                <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isHandDetected && !isCameraPaused ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-ping' : 'bg-slate-600'}`} />
              </div>
            </div>

            {showInstructions && (
              <div className="rounded-lg bg-slate-800/60 p-2 sm:p-3 text-[10px] sm:text-[11px] text-slate-300 border border-slate-700/30 flex flex-col gap-1.5 sm:gap-2">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <span>How to use:</span>
                </div>
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  <div className="flex items-start gap-1 sm:gap-1.5">
                    <Hand className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 flex-shrink-0" />
                    <span><strong>Open hand</strong> to move freely.</span>
                  </div>
                  <div className="flex items-start gap-1 sm:gap-1.5">
                    <span className="text-emerald-400 font-bold flex-shrink-0">🤏</span>
                    <span><strong>Pinch fingers</strong> together to "Grab".</span>
                  </div>
                  <div className="flex items-start gap-1 sm:gap-1.5">
                    <Navigation className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 flex-shrink-0" />
                    <span>While grabbing, <strong>move hand</strong> to drag page.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleGestureControl}
        className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-2 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-semibold shadow-xl border transition-all duration-300 pointer-events-auto ${
          isActive 
            ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500' 
            : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
        }`}
      >
        {isActive ? (
          <>
            <CameraOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Disable Gesture Scroll</span>
          </>
        ) : (
          <>
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Enable Gesture Scrolling</span>
          </>
        )}
      </button>
    </div>
  );
}
