'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function RainVisual() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { scrollY } = useScroll();
    
    const y = useTransform(scrollY, [0, 1000], [0, 100]);
    const opacity = useTransform(scrollY, [0, 500], [1, 0.7]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let elements: (RainDrop | FishSplash)[] = [];
        
        class RainDrop {
            x: number;
            y: number;
            length: number;
            speed: number;
            opacity: number;
            isFish: boolean;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * -canvas!.height;
                this.length = Math.random() * 25 + 15;
                this.speed = Math.random() * 8 + 12;
                this.opacity = Math.random() * 0.4 + 0.2;
                this.isFish = Math.random() > 0.94;
            }

            update() {
                this.y += this.speed;
                if (this.y > canvas!.height) {
                    elements.push(new FishSplash(this.x, canvas!.height));
                    this.y = -20;
                    this.x = Math.random() * canvas!.width;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                // Rain color: Vibrant Cyan/Blue
                const rainColor = `rgba(0, 164, 253, ${this.opacity})`;
                
                if (this.isFish) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.fillStyle = rainColor;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 3, 10, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Add a tiny glow
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(0, 164, 253, 0.5)';
                    ctx.restore();
                } else {
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x, this.y + this.length);
                    ctx.strokeStyle = rainColor;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }

        class FishSplash {
            x: number;
            y: number;
            particles: { x: number, y: number, vx: number, vy: number, alpha: number, size: number }[];
            life: number;
            maxLife: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.particles = [];
                this.life = 0;
                this.maxLife = 25;
                
                for (let i = 0; i < 4; i++) {
                    this.particles.push({
                        x: 0,
                        y: 0,
                        vx: (Math.random() - 0.5) * 5,
                        vy: -Math.random() * 10 - 3,
                        alpha: 0.7,
                        size: Math.random() * 2.5 + 1.5
                    });
                }
            }

            update() {
                this.life++;
                this.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.5; // gravity
                    p.alpha -= 0.03;
                });
            }

            draw() {
                if (!ctx) return;
                this.particles.forEach(p => {
                    if (p.alpha <= 0) return;
                    ctx.save();
                    ctx.translate(this.x + p.x, this.y + p.y);
                    ctx.rotate(Math.atan2(p.vy, p.vx));
                    ctx.fillStyle = `rgba(0, 164, 253, ${p.alpha})`;
                    
                    ctx.beginPath();
                    ctx.ellipse(0, 0, p.size * 2.5, p.size, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            }
        }

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            elements = [];
            for (let i = 0; i < 120; i++) {
                elements.push(new RainDrop());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            elements = elements.filter(el => !(el instanceof FishSplash && el.life > el.maxLife));
            elements.forEach(el => {
                el.update();
                el.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', init);
        init();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', init);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden bg-[#e6f4f9]">
            {/* Bright Rainy Background Image */}
            <motion.div 
                style={{ y, opacity }}
                className="absolute inset-0 z-0"
            >
                <img 
                    src="/rain-bg.png" 
                    alt="Rainy Background" 
                    className="w-full h-full object-cover"
                />
            </motion.div>

            {/* Cyan Rain Canvas */}
            <canvas 
                ref={canvasRef}
                className="absolute inset-0 z-10 pointer-events-none"
            />

            {/* Soft Ambient Overlays */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Soft Blue Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-white/40" />
                
                {/* Subtle Lens Flare / Bloom */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,164,253,0.1)_0%,transparent_50%)]" />
                
                {/* Smooth transition to page content */}
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white via-white/40 to-transparent" />
            </div>
        </div>
    );
}
