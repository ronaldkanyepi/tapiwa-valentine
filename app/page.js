'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

const FloatingHearts = () => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    // Generate static hearts for background
    const newHearts = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: Math.random() * 10 + 10 + 's',
      animationDelay: Math.random() * 10 + 's',
      fontSize: Math.random() * 20 + 10 + 'px',
      opacity: Math.random() * 0.5 + 0.1
    }));
    setHearts(newHearts);
  }, []);

  return (
    <div className="bg-hearts">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: heart.left,
            animationDuration: heart.animationDuration,
            animationDelay: heart.animationDelay,
            fontSize: heart.fontSize,
            opacity: heart.opacity
          }}
        >
          {['❤️', '💖', '💕', '🌸', '✨'][Math.floor(Math.random() * 5)]}
        </div>
      ))}
    </div>
  );
};

export default function Home() {
  const [yesDecor, setYesDecor] = useState('💖');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState('');
  // New states
  const [toasts, setToasts] = useState([]);
  const [yesScale, setYesScale] = useState(1);
  const [patience, setPatience] = useState(5);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef(null);
  const btnRef = useRef(null);

  const maxAttempts = 6;

  const teasers = [
    "Nice try, Tapiwa! 😏",
    "Too slow! 🐢",
    "Gotta be faster! 💨",
    "You thought! 😂",
    "Catch me if you can! 💅",
    "Almost had it! 🤏",
    "Not today! 🤪",
    "Keep chasing! 🏃‍♀️",
    "Nope! 😋"
  ];

  const emojis = ['💖', '💘', '💌', '🥰', '💕', '💓'];

  // Toast System
  const addToast = (msg) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  };

  // Sound Effects using Web Audio API
  const playSound = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();

      const playTone = (freq, type, duration, delay = 0) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      if (type === 'move') {
        // Swoosh/Pop
        playTone(600, 'sine', 0.1);
        playTone(400, 'triangle', 0.1, 0.05);
      } else if (type === 'no') {
        // Bonk
        playTone(150, 'sawtooth', 0.1);
        playTone(100, 'sawtooth', 0.2, 0.1);
      } else if (type === 'win') {
        // Tada / Chime
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { // C Major
          playTone(freq, 'sine', 0.6, i * 0.1);
        });
      }
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const moveButton = useCallback(() => {
    if (accepted) return;

    // Play sound
    playSound('move');

    if (attempts < maxAttempts) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPatience(Math.max(0, 5 - Math.floor(newAttempts * (5 / maxAttempts))));

      setIsMoving(true);

      // Smart positioning: avoid edges and account for scale
      // Note: offsetWidth is unscaled. We need to account for the scale factor.
      const currentScale = yesScale || 1;
      // Approximate width/height if ref is missing
      const baseWidth = btnRef.current ? btnRef.current.offsetWidth : 120;
      const baseHeight = btnRef.current ? btnRef.current.offsetHeight : 50;

      const btnWidth = baseWidth * currentScale;
      const btnHeight = baseHeight * currentScale;

      // Safety margin for notches and rounded corners
      const margin = 20;

      // Use window dimensions but subtract button size AND margin
      const maxX = window.innerWidth - btnWidth - margin;
      const maxY = window.innerHeight - btnHeight - margin;
      const minX = margin;
      const minY = margin;

      // Ensure we don't end up with negative ranges (which would push it offscreen)
      // If the button is wider than the screen (due to massive scale), clamp to 0 or center?
      // Let's clamp to safe area.
      const safeMaxX = Math.max(minX, maxX);
      const safeMaxY = Math.max(minY, maxY);

      const x = Math.random() * (safeMaxX - minX) + minX;
      const y = Math.random() * (safeMaxY - minY) + minY;

      setPosition({ x, y });
      setYesDecor(emojis[newAttempts % emojis.length]);
      setMessage(teasers[newAttempts % teasers.length]);

    } else {
      setIsMoving(false);
      setMessage("Okay okay, I give up! 🥰");
    }
  }, [attempts, accepted]);

  const handleInteraction = (e) => {
    // Only dodge if we haven't accepted yet
    if (accepted || attempts >= maxAttempts) return;

    // Check if it's touch or mouse
    if (e.type === 'touchstart') {
      // Prevent default to stop the click event from firing immediately (scrolling/zooming might be affected but for a button it's fine)
      // This ensures the button moves BEFORE 'click' can happen
      e.preventDefault();
      moveButton();
    } else {
      // Mouse hover
      moveButton();
    }
  };

  const handleYesClick = () => {
    // Determine if we should allow the click
    // If it's stopped moving (max attempts reached), allow it.
    // OR if the user is just incredibly fast/lucky (we can be nice).

    // Force move if they try to click before ready?
    // Let's be playful: 
    if (attempts < maxAttempts) {
      // If they managed to click it while moving, let them win? 
      // Or move it one last time?
      // Let's be strict but fair: 50% chance to slip away if clicked too early
      if (Math.random() > 0.5) {
        moveButton();
        return;
      }
    }

    playSound('win');
    setAccepted(true);
    triggerConfetti();
    setMessage("Finally... my Valentine! 💌");
    setYesDecor("💑");
    setIsMoving(false);
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleNoClick = () => {
    playSound('no');

    // Scale up the Yes button
    setYesScale(prev => Math.min(prev + 0.2, 3)); // Max 3x size

    const noMessages = [
      "I think you meant to click Yes! 🤭",
      "Oops! Wrong button! 🙈",
      "But I promise I'm nice! 🥺",
      "Are you sure? Look again! 👀",
      "Just click Yes already! 💖",
      "My heart can't take this! 💔",
      "Pretty please? 🥺👉👈",
      "Don't break my heart! 💔",
      "Be nice! 🌹"
    ];
    const newMsg = noMessages[Math.floor(Math.random() * noMessages.length)];

    // Show as toast AND main message
    setMessage(newMsg);
    addToast(newMsg);
  };

  return (
    <main className="container" ref={containerRef}>
      <FloatingHearts />

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '12px 24px',
            borderRadius: '50px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            color: '#ff477e',
            fontWeight: 'bold',
            animation: 'float-up-fade 2s forwards',
            whiteSpace: 'nowrap'
          }}>
            {toast.msg}
          </div>
        ))}
      </div>

      {accepted ? (
        <div className="valentine-card animate-pulse" style={{ animationDuration: '3s' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            Hehe, I knew it! 🥰
          </h1>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#555' }}>
            Why are you smiling then? 😂😂😂
          </p>
          <div style={{ fontSize: '6rem', marginTop: '30px', animation: 'float 3s ease-in-out infinite' }}>
            💑
          </div>
        </div>
      ) : (
        <div className="valentine-card">
          <div style={{ fontSize: '5rem', marginBottom: '10px' }} className="animate-float">
            💘
          </div>
          <h1>Tapiwa, Will you be my Valentine?</h1>

          <div style={{
            minHeight: '40px',
            margin: '15px 0',
            fontSize: '1.3rem',
            fontWeight: 'bold',
            color: '#e01b24', /* Darker readable red */
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 1px 2px rgba(255,255,255,0.8)'
          }}>
            {message || "Please? 🥺"}
          </div>

          {!accepted && (
            <div style={{ marginBottom: '20px', fontSize: '1rem', color: '#888', letterSpacing: '2px' }}>
              {attempts < maxAttempts ? 'Patience:' : 'Patience:'} {'💫'.repeat(patience)}
              {patience === 0 && <span style={{ opacity: 0.5 }}>EMPTY</span>}
            </div>
          )}

          <div className="btn-group">
            <button className="btn btn-no" onClick={handleNoClick}>
              No ❌
            </button>

            <button
              ref={btnRef}
              className="btn btn-yes"
              style={
                isMoving && attempts < maxAttempts
                  ? {
                    position: 'fixed',
                    left: position.x + 'px',
                    top: position.y + 'px',
                    zIndex: 100,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    transform: `scale(${yesScale})`
                  }
                  : { transform: `scale(${yesScale})` }
              }
              onMouseEnter={handleInteraction}
              onTouchStart={handleInteraction}
              onClick={handleYesClick}
            >
              Yes {yesDecor}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
