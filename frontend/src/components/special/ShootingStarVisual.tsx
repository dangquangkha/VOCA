'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function ShootingStarVisual() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { scrollY } = useScroll();
    
    const y = useTransform(scrollY, [0, 1000], [0, 120]);
    const opacity = useTransform(scrollY, [0, 500], [1, 0.6]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Star[] = [];
        let shootingStars: ShootingStar[] = [];
        
        class Star {
            x: number;
            y: number;
            size: number;
            twinkleSpeed: number;
            twinklePhase: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 1.5;
                this.twinkleSpeed = Math.random() * 0.05 + 0.01;
                this.twinklePhase = Math.random() * Math.PI * 2;
            }

            draw() {
                const alpha = (Math.sin(this.twinklePhase) + 1) / 2 * 0.5 + 0.2;
                ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fill();
                this.twinklePhase += this.twinkleSpeed;
            }
        }

        class ShootingStar {
            x!: number;
            y!: number;
            length!: number;
            speed!: number;
            angle!: number;
            opacity!: number;
            color!: string;

            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height * 0.5;
                this.length = Math.random() * 80 + 100;
                this.speed = Math.random() * 15 + 20;
                this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
                this.opacity = 0;
                this.color = Math.random() > 0.5 ? '#00A4FD' : '#FF00E5';
            }

            update() {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                this.opacity += 0.05;
                if (this.opacity > 1) this.opacity = 1;
                
                if (this.x > canvas!.width || this.y > canvas!.height) {
                    this.reset();
                    this.x = Math.random() * canvas!.width;
                    this.y = -100;
                }
            }

            draw() {
                if (!ctx) return;
                const gradient = ctx.createLinearGradient(
                    this.x, this.y, 
                    this.x - Math.cos(this.angle) * this.length, 
                    this.y - Math.sin(this.angle) * this.length
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, ' + this.opacity + ')');
                gradient.addColorStop(0.1, this.color);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - Math.cos(this.angle) * this.length, this.y - Math.sin(this.angle) * this.length);
                ctx.stroke();

                // Head glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
            }
        }

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            for (let i = 0; i < 200; i++) stars.push(new Star());
            shootingStars = [];
            for (let i = 0; i < 3; i++) shootingStars.push(new ShootingStar());
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(s => s.draw());
            shootingStars.forEach(s => {
                s.update();
                s.draw();
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
        <div className="absolute inset-0 overflow-hidden bg-[#050b18]">
            {/* Kimi no Na wa Background */}
            <motion.div 
                style={{ y, opacity }}
                className="absolute inset-0 z-0"
            >
                <img 
                    src="/pricing-bg.png" 
                    alt="Starry Night Background" 
                    className="w-full h-full object-cover brightness-[0.6]"
                />
            </motion.div>

            {/* Shooting Stars Canvas */}
            <canvas 
                ref={canvasRef}
                className="absolute inset-0 z-10 pointer-events-none"
            />

            {/* Atmospheric Overlays */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050b18]/80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,164,253,0.15)_0%,transparent_70%)]" />
            </div>
        </div>
    );
}
