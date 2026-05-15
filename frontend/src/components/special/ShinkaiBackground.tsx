'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ShinkaiBackgroundProps {
    imagePath?: string;
    overlayColor?: string;
    showFish?: boolean;
    fishCount?: number;
    className?: string;
}

export default function ShinkaiBackground({ 
    imagePath = '/roadmap-bg.svg', 
    overlayColor = 'rgba(255, 255, 255, 0.1)',
    showFish = true,
    fishCount = 25,
    className = "fixed inset-0"
}: ShinkaiBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!showFish) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let fishArray: WaterFish[] = [];
        let mouse = { x: -1000, y: -1000 };

        class WaterFish {
            x: number;
            y: number;
            size: number;
            angle: number;
            velocity: number;
            wiggleSpeed: number;
            wigglePhase: number;
            opacity: number;
            length: number;
            color: string;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 3 + 2;
                this.length = this.size * 10;
                this.angle = Math.random() * Math.PI * 2;
                this.velocity = Math.random() * 0.6 + 0.3;
                this.wiggleSpeed = Math.random() * 0.12 + 0.05;
                this.wigglePhase = Math.random() * Math.PI * 2;
                this.opacity = Math.random() * 0.3 + 0.2;
                this.color = Math.random() > 0.5 ? '#A5D6F7' : '#FFFFFF';
            }

            update() {
                this.wigglePhase += this.wiggleSpeed;
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    const angleToMouse = Math.atan2(dy, dx);
                    this.angle -= (angleToMouse - this.angle + Math.PI) * 0.05;
                    this.velocity = 2.0;
                } else {
                    this.velocity *= 0.98;
                    if (this.velocity < 0.6) this.velocity = 0.6;
                }

                this.x += Math.cos(this.angle) * this.velocity;
                this.y += Math.sin(this.angle) * this.velocity;

                const pad = 100;
                if (this.x < -pad) this.x = canvas!.width + pad;
                if (this.x > canvas!.width + pad) this.x = -pad;
                if (this.y < -pad) this.y = canvas!.height + pad;
                if (this.y > canvas!.height + pad) this.y = -pad;
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                const wiggle = Math.sin(this.wigglePhase) * 4;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, -Math.PI/2, Math.PI/2, false);
                ctx.bezierCurveTo(-this.length * 0.4, this.size + wiggle, -this.length * 0.7, wiggle * 1.5, -this.length, wiggle * 2);
                ctx.bezierCurveTo(-this.length * 0.7, -wiggle * 1.5, -this.length * 0.4, -this.size - wiggle, 0, -this.size);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.opacity;
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(165, 214, 247, 0.5)';
                ctx.fill();
                ctx.restore();
            }
        }

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            fishArray = [];
            for (let i = 0; i < fishCount; i++) {
                fishArray.push(new WaterFish());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            fishArray.forEach(fish => {
                fish.update();
                fish.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', init);
        init();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', init);
        };
    }, [showFish, fishCount]);

    return (
        <div className={`${className} z-0 overflow-hidden pointer-events-none`}>
            <img 
                src={imagePath} 
                alt="Shinkai Background" 
                className="w-full h-full object-cover"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                        parent.style.background = 'linear-gradient(to bottom, #0B1026, #1B264F, #2E4C80)';
                    }
                }}
            />
            <div className="absolute inset-0" style={{ backgroundColor: overlayColor }} />
            {showFish && (
                <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 z-10"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />
        </div>
    );
}
