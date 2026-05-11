'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function HeroVisual() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    
    const y = useTransform(scrollY, [0, 1000], [0, 150]);
    const scale = useTransform(scrollY, [0, 1000], [1, 1.05]);
    const opacity = useTransform(scrollY, [0, 500], [1, 0.4]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let fishArray: WaterFish[] = [];
        const fishCount = 35; // Giảm số lượng để tập trung vào chất lượng
        
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
                this.size = Math.random() * 4 + 3; // Cá to hơn
                this.length = this.size * 12;
                this.angle = Math.random() * Math.PI * 2;
                this.velocity = Math.random() * 0.8 + 0.4;
                this.wiggleSpeed = Math.random() * 0.15 + 0.08;
                this.wigglePhase = Math.random() * Math.PI * 2;
                this.opacity = Math.random() * 0.4 + 0.3; // Tăng độ đậm
                this.color = Math.random() > 0.5 ? '#A5D6F7' : '#FFFFFF';
            }

            update() {
                this.wigglePhase += this.wiggleSpeed;
                
                // Tương tác chuột: Cá bơi tránh xa chuột một cách linh hoạt
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 250) {
                    const angleToMouse = Math.atan2(dy, dx);
                    // Bơi ngược hướng chuột
                    this.angle -= (angleToMouse - this.angle + Math.PI) * 0.05;
                    this.velocity = 2.5; // Tăng tốc khi "giật mình"
                } else {
                    this.velocity *= 0.98;
                    if (this.velocity < 0.8) this.velocity = 0.8;
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
                
                // Vẽ thân cá nước (dạng giọt nước kéo dài)
                const wiggle = Math.sin(this.wigglePhase) * 6;
                
                ctx.beginPath();
                // Đầu cá
                ctx.arc(0, 0, this.size, -Math.PI/2, Math.PI/2, false);
                
                // Thân và đuôi uốn lượn
                ctx.bezierCurveTo(
                    -this.length * 0.4, this.size + wiggle,
                    -this.length * 0.7, wiggle * 1.5,
                    -this.length, wiggle * 2
                );
                
                // Quay lại đầu
                ctx.bezierCurveTo(
                    -this.length * 0.7, -wiggle * 1.5,
                    -this.length * 0.4, -this.size - wiggle,
                    0, -this.size
                );

                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.opacity;
                
                // Hiệu ứng phát sáng nhẹ (Glow)
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'rgba(165, 214, 247, 0.6)';
                ctx.fill();
                
                // Viền bóng loáng của nước
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 0.5;
                ctx.stroke();

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

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('resize', init);
        
        init();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('resize', init);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[#e0f7ff] z-0">
            {/* Background Image */}
            <motion.div 
                style={{ y, scale, opacity }}
                className="absolute inset-0 z-0"
            >
                <img 
                    src="/hero-bg.png" 
                    alt="Weathering With You Background" 
                    className="w-full h-full object-cover"
                />
            </motion.div>

            {/* Canvas Cá Nước - Đảm bảo Z-Index cao */}
            <canvas 
                ref={canvasRef}
                className="absolute inset-0 z-30 pointer-events-none"
            />

            {/* Overlays */}
            <div className="absolute inset-0 z-40 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.4)_0%,transparent_60%)]" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent" />
            </div>
        </div>
    );
}
