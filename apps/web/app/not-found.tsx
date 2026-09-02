"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  RotateCcw,
  Trophy,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FUNNY_MESSAGES = [
  "Keep the visitor alive!",
  "1 visitor saved from the quantum void!",
  "Nice catch! Traffic bounce deflected.",
  "Combo! Analytics engine happily ingesting.",
  "Look at those paddle reflexes!",
  "Session duration increasing: +30s",
  "UTM Source: retro_arcade | Campaign: 404_hero",
  "Server latency: 0.1ms — Absolute gamer mode.",
  "You've saved more traffic than an ad-block bypass!",
  "Dimensional champion! High score incoming!",
];

export default function NotFoundPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game State
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [toastMsg, setToastMsg] = useState<string>("Press Space or Click to Start");

  // Physics state kept in ref for 60fps requestAnimationFrame
  const stateRef = useRef({
    paddleX: 195,
    paddleWidth: 90,
    paddleHeight: 12,
    paddleSpeed: 7.5,
    ballX: 240,
    ballY: 100,
    ballRadius: 7,
    ballSpeedX: 3.6,
    ballSpeedY: 3.6,
    baseSpeed: 3.6,
    currentSpeed: 3.6,
    courtWidth: 480,
    courtHeight: 280,
    isLeftPressed: false,
    isRightPressed: false,
    isPlaying: false,
    score: 0,
    sparks: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("analytika_404_highscore");
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // Start / Restart game
  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    setScore(0);
    s.paddleX = (s.courtWidth - s.paddleWidth) / 2;
    s.ballX = s.courtWidth / 2;
    s.ballY = 80;
    s.baseSpeed = 3.6;
    s.currentSpeed = 3.6;
    const dir = Math.random() > 0.5 ? 1 : -1;
    s.ballSpeedX = dir * s.currentSpeed;
    s.ballSpeedY = s.currentSpeed;
    s.isPlaying = true;
    s.isLeftPressed = false;
    s.isRightPressed = false;
    s.sparks = [];
    setGameState("playing");
    setToastMsg(FUNNY_MESSAGES[0]);
  }, []);

  // Keyboard controls - blocked when not playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (!stateRef.current.isPlaying) {
          e.preventDefault();
          startGame();
          return;
        }
      }

      if (!stateRef.current.isPlaying) return;

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        stateRef.current.isLeftPressed = true;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        stateRef.current.isRightPressed = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        stateRef.current.isLeftPressed = false;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        stateRef.current.isRightPressed = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startGame]);

  // Mouse / Touch pointer movement across canvas - blocked when not playing
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = stateRef.current.courtWidth / rect.width;
    const clientX = (e.clientX - rect.left) * scaleX;
    stateRef.current.paddleX = Math.max(
      0,
      Math.min(stateRef.current.courtWidth - stateRef.current.paddleWidth, clientX - stateRef.current.paddleWidth / 2)
    );
  };

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      const W = s.courtWidth;
      const H = s.courtHeight;

      // 1. Update Paddle (only when actively playing)
      if (s.isPlaying) {
        if (s.isLeftPressed) {
          s.paddleX = Math.max(0, s.paddleX - s.paddleSpeed);
        }
        if (s.isRightPressed) {
          s.paddleX = Math.min(W - s.paddleWidth, s.paddleX + s.paddleSpeed);
        }

        // Overtime gradual speed acceleration (+0.0008 per frame)
        s.currentSpeed = Math.min(10.5, s.currentSpeed + 0.0008);

        // 2. Update Ball & Physics
        s.ballX += s.ballSpeedX;
        s.ballY += s.ballSpeedY;

        // Bounce left / right walls
        if (s.ballX - s.ballRadius <= 0) {
          s.ballX = s.ballRadius;
          s.ballSpeedX = Math.abs(s.ballSpeedX);
        } else if (s.ballX + s.ballRadius >= W) {
          s.ballX = W - s.ballRadius;
          s.ballSpeedX = -Math.abs(s.ballSpeedX);
        }

        // Bounce top ceiling
        if (s.ballY - s.ballRadius <= 0) {
          s.ballY = s.ballRadius;
          s.ballSpeedY = Math.abs(s.ballSpeedY);
        }

        // Paddle Collision Check
        const paddleTop = H - 28;
        const paddleBottom = paddleTop + s.paddleHeight;
        if (
          s.ballY + s.ballRadius >= paddleTop &&
          s.ballY - s.ballRadius <= paddleBottom &&
          s.ballX >= s.paddleX - 4 &&
          s.ballX <= s.paddleX + s.paddleWidth + 4 &&
          s.ballSpeedY > 0
        ) {
          s.score += 1;
          setScore(s.score);

          // Score-based speed scaling
          s.currentSpeed = Math.min(10.5, 3.6 + s.score * 0.28);

          // Calculate bounce angle based on impact position
          const hitPoint = (s.ballX - (s.paddleX + s.paddleWidth / 2)) / (s.paddleWidth / 2);
          s.ballSpeedX = hitPoint * (s.currentSpeed * 0.95);
          s.ballSpeedY = -Math.sqrt(Math.max(6, s.currentSpeed * s.currentSpeed - s.ballSpeedX * s.ballSpeedX));

          // Update High Score
          setHighScore((prev) => {
            const next = Math.max(prev, s.score);
            try {
              localStorage.setItem("analytika_404_highscore", String(next));
            } catch {}
            return next;
          });

          // Funny message
          const msgIdx = Math.min(s.score, FUNNY_MESSAGES.length - 1);
          setToastMsg(FUNNY_MESSAGES[msgIdx]);

          // Create impact particle sparks
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI - Math.PI;
            const spd = 1.5 + Math.random() * 3;
            s.sparks.push({
              x: s.ballX,
              y: paddleTop,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              life: 1.0,
              color: i % 2 === 0 ? "#F43F5E" : "#800E13",
            });
          }
        }

        // Ball falls through bottom => Game Over
        if (s.ballY - s.ballRadius > H) {
          s.isPlaying = false;
          s.isLeftPressed = false;
          s.isRightPressed = false;
          setGameState("gameover");
          setToastMsg(`Game Over! Score: ${s.score}`);
        }
      }

      // 3. Clear Screen & Draw Court
      ctx.fillStyle = "#191919";
      ctx.fillRect(0, 0, W, H);

      // Huge transparent "404" watermark in center of play area
      ctx.font = "900 120px monospace, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.fillText("404", W / 2, H / 2 - 5);

      // Subtle Grid pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Middle Net Line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Draw Particle Sparks
      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const p = s.sparks[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          s.sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 5. Draw Paddle (Platform)
      const paddleTop = H - 28;
      const paddleRadius = 6;
      ctx.fillStyle = "#800E13";
      ctx.beginPath();
      ctx.roundRect(s.paddleX, paddleTop, s.paddleWidth, s.paddleHeight, paddleRadius);
      ctx.fill();

      // Top glowing highlight on paddle
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.roundRect(s.paddleX + 4, paddleTop + 1, s.paddleWidth - 8, 2, 1);
      ctx.fill();

      // 6. Draw Bouncing Ball (Visitor Event Node)
      const ballGrad = ctx.createRadialGradient(
        s.ballX - 2,
        s.ballY - 2,
        1,
        s.ballX,
        s.ballY,
        s.ballRadius
      );
      ballGrad.addColorStop(0, "#FFFFFF");
      ballGrad.addColorStop(0.3, "#F43F5E");
      ballGrad.addColorStop(1, "#800E13");

      // Ball Outer Glow
      ctx.shadowColor = "rgba(244, 63, 94, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, s.ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <main className="min-h-screen bg-[#1F1F1F] text-zinc-100 flex flex-col items-center justify-between p-4 sm:p-6 font-sans select-none">
      {/* Top Navbar */}
      <header className="w-full max-w-2xl flex items-center justify-between py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.svg"
            alt="Analytika Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-white">
            Analytika
          </span>
        </Link>
      </header>

      {/* Center Game & 404 Card */}
      <div className="w-full max-w-xl flex flex-col items-center my-auto space-y-4 py-2">
        {/* Title Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            404: Page Not Found
          </h1>
          <p className="text-xs text-zinc-400 max-w-md">
            Use your{" "}
            <kbd className="px-1.5 py-0.5 bg-[#262626] border border-white/[0.1] rounded text-[10px] font-mono text-zinc-300">
              ←
            </kbd>{" "}
            <kbd className="px-1.5 py-0.5 bg-[#262626] border border-white/[0.1] rounded text-[10px] font-mono text-zinc-300">
              →
            </kbd>{" "}
            arrow keys or mouse to move the platform and bounce the visitor ball.
          </p>
        </div>

        {/* Main Arcade Frame */}
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl bg-[#262626] border border-white/[0.08] p-3 flex flex-col items-center space-y-3"
        >
          {/* Top Score Ribbon */}
          <div className="w-full flex items-center justify-between px-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-medium">Saved:</span>
              <span className="font-extrabold text-sm text-white px-2 py-0.5 rounded-md bg-[#1F1F1F] border border-white/[0.06]">
                {score}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
              <Trophy className="w-3.5 h-3.5" />
              <span>Best: {highScore}</span>
            </div>
          </div>

          {/* Interactive HTML5 Canvas */}
          <div className="relative w-full aspect-[480/280] rounded-xl overflow-hidden border border-white/[0.06] bg-[#191919]">
            <canvas
              ref={canvasRef}
              width={480}
              height={280}
              onPointerMove={handlePointerMove}
              onClick={() => {
                if (gameState !== "playing") startGame();
              }}
              className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
            />

            {/* Start Screen Overlay */}
            {gameState === "idle" && (
              <div
                onClick={startGame}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#800E13] border border-white/[0.15] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform mb-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Click or Press Space to Play</h3>
                <p className="text-[11px] font-mono text-zinc-400">
                  Control with Arrow keys (← →) or Mouse / Touch
                </p>
              </div>
            )}

            {/* Game Over Screen Overlay */}
            {gameState === "gameover" && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-3 animate-in fade-in duration-200">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-white">Score: {score}</h3>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={startGame}
                    className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs font-semibold h-8 px-4 rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Play Again (Space)</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Toast / Status Footer */}
          <div className="w-full text-center text-[11px] font-mono text-zinc-400 py-0.5">
            <span>{toastMsg}</span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/dashboard">
            <Button
              type="button"
              className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs font-semibold h-9 px-5 rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2 group"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Safety (Dashboard)</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
