import { useRef, useEffect, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Audio,
  Img,
} from "remotion";
import { useContext, createContext } from "react";

const PlayfairDisplay = "Georgia, serif";
const Poppins = "system-ui, sans-serif";
void PlayfairDisplay; void Poppins;

const FALLBACK_LOGO = "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#D2691E;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="30" fill="url(#bg)"/>
  <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" font-size="80" font-weight="bold" fill="#FFF">A</text>
</svg>
`);

export const IntroVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Colors
  const primary = "#8B4513";
  const accent = "#D2691E";
  const cream = "#FDF5E6";
  
  // Phase timing
  const phase1End = fps * 1.5; // Logo appears
  const phase2End = fps * 3;    // Tagline
  const phase3End = fps * 5;    // Final fade
  
  // Logo animation
  const logoScale = spring({ frame, fps, config: { damping: 200, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [0, phase1End * 0.3, phase1End * 0.7], [0, 1, 1], { extrapolateRight: "clamp" });
  
  // Tagline animation
  const taglineOpacity = interpolate(frame, [phase1End, phase1End + fps * 0.5, phase2End - fps * 0.5], [0, 1, 1], { extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [phase1End, phase1End + fps * 0.5], [30, 0], { extrapolateRight: "clamp" });
  
  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [phase1End + fps * 0.8, phase1End + fps * 1.3, phase3End - fps * 1], [0, 1, 1], { extrapolateRight: "clamp" });
  
  // Final fade out
  const finalOpacity = interpolate(frame, [phase3End - fps * 1, phase3End], [1, 0], { extrapolateRight: "clamp" });
  
  // Particle effects
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * fps * 2,
    duration: Math.random() * fps + fps,
  }));
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: cream,
        opacity: finalOpacity,
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 30% 30%, ${cream} 0%, #F5DEB3 50%, #DEB887 100%)`,
        }}
      />
      
      {/* Floating particles */}
      {particles.map((p, i) => {
        const particleFrame = Math.max(0, frame - p.delay);
        const y = interpolate(particleFrame % p.duration, [0, p.duration], [110, -10], { extrapolateRight: "clamp" });
        const opacity = interpolate(particleFrame % p.duration, [0, p.duration * 0.2, p.duration * 0.8, p.duration], [0, 0.6, 0.6, 0], { extrapolateRight: "clamp" });
        
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: primary,
              opacity,
            }}
          />
        );
      })}
      
      {/* Coffee steam effect */}
      <div style={{ position: "absolute", bottom: "40%", left: "50%", transform: "translateX(-50%)" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * 20 - 20,
              width: 60,
              height: 80,
              borderRadius: "50%",
              background: `radial-gradient(ellipse, rgba(139,69,19,0.15) 0%, transparent 70%)`,
              animation: `steam 2s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
      
      {/* Logo container */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          transform: `translateX(-50%) scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        {/* Logo circle */}
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: 40,
            background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 20px 60px rgba(139, 69, 19, 0.4)`,
          }}
        >
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 100,
              fontWeight: "bold",
              color: cream,
              lineHeight: 1,
            }}
          >
            A
          </span>
        </div>
        
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: 60,
            background: `radial-gradient(circle, rgba(210, 105, 30, 0.3) 0%, transparent 70%)`,
            zIndex: -1,
          }}
        />
      </div>
      
      {/* Brand name */}
      <div
        style={{
          position: "absolute",
          top: "52%",
          left: "50%",
          transform: `translateX(-50%) translateY(${taglineY}px)`,
          opacity: taglineOpacity,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 72,
            fontWeight: "bold",
            color: primary,
            margin: 0,
            letterSpacing: 8,
            textShadow: "2px 2px 4px rgba(139, 69, 19, 0.2)",
          }}
        >
          AZURA
        </h1>
      </div>
      
      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          top: "66%",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: subtitleOpacity,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 22,
            color: accent,
            margin: 0,
            letterSpacing: 2,
            fontWeight: 300,
          }}
        >
          YOUR FAVORITE CAFE
        </p>
      </div>
      
      {/* Decorative lines */}
      <div
        style={{
          position: "absolute",
          top: "75%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: subtitleOpacity,
        }}
      />
      
      {/* Corner decorations */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 30,
          width: 60,
          height: 60,
          borderTop: `3px solid ${primary}`,
          borderLeft: `3px solid ${primary}`,
          opacity: subtitleOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          width: 60,
          height: 60,
          borderBottom: `3px solid ${primary}`,
          borderRight: `3px solid ${primary}`,
          opacity: subtitleOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

export default IntroVideo;