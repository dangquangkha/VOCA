'use client';

import React, { useEffect, useRef } from 'react';

interface Ripple {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    alpha: number;
    speed: number;
    active: boolean;
    isClick: boolean;
}

// Object Pool — tái sử dụng objects, tránh GC pressure
const POOL_SIZE = 30;
const createPool = (): Ripple[] =>
    Array.from({ length: POOL_SIZE }, () => ({
        x: 0, y: 0, radius: 0, maxRadius: 0,
        alpha: 0, speed: 0, active: false, isClick: false,
    }));

export default function WaterRipple() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Pool tái sử dụng — không tạo object mới mỗi frame
        const pool = createPool();
        let animFrameId = 0;
        let isAnimating = false;
        let isTabVisible = true;
        let lastMoveTime = 0;
        const MOVE_THROTTLE_MS = 80; // Tăng lên 80ms — đủ mượt, ít ripple hơn

        // ── Resize ──────────────────────────────────────────────
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize, { passive: true });
        resize();

        // ── Lấy ripple từ pool ───────────────────────────────────
        const acquireRipple = (x: number, y: number, isClick: boolean) => {
            // Tìm slot trống trong pool
            const slot = pool.find(r => !r.active);
            if (!slot) return; // Pool đầy → bỏ qua, không tạo mới
            slot.x = x;
            slot.y = y;
            slot.radius = 0;
            slot.maxRadius = isClick ? 1200 : 840; 
            slot.alpha = isClick ? 0.85 : 0; // Click rực rỡ, hover tắt hẳn
            slot.speed = isClick ? 1.5 : 0.6;      
            slot.isClick = isClick;
            slot.active = isClick; // Chỉ kích hoạt nếu là click
        };

        // ── Khởi động animation loop (chỉ khi có ripple) ────────
        const startAnimating = () => {
            if (isAnimating || !isTabVisible) return;
            isAnimating = true;
            animFrameId = requestAnimationFrame(animate);
        };

        // ── Animation loop ───────────────────────────────────────
        const animate = () => {
            let hasActive = false;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < pool.length; i++) {
                const r = pool[i];
                if (!r.active) continue;
                hasActive = true;

                // Vẽ 2 vòng đồng tâm khi click cho ấn tượng
                const ringSpacing = 64;
                for (let k = 0; k < 2; k++) {
                    const ringRadius = r.radius - k * ringSpacing;
                    if (ringRadius <= 0) continue;

                    const progress = ringRadius / r.maxRadius;
                    const ringAlpha = r.alpha * (1 - progress) * (1 - k * 0.4);
                    
                    if (ringAlpha > 0.003) {
                        ctx.beginPath();
                        ctx.arc(r.x, r.y, ringRadius, 0, Math.PI * 2);
                        const color = `rgba(255, 255, 255, ${ringAlpha.toFixed(3)})`; // Pure white color for click
                        ctx.strokeStyle = color;
                        ctx.lineWidth = k === 0 ? 3.5 : 1.5; 
                        ctx.stroke();
                    }
                }

                r.radius += r.speed;
                r.alpha -= 0.006; 


                // Trả về pool khi xong
                if (r.alpha <= 0 || r.radius > r.maxRadius) {
                    r.active = false;
                }
            }

            if (hasActive) {
                // Còn ripple → tiếp tục loop
                animFrameId = requestAnimationFrame(animate);
            } else {
                // Không còn ripple → dừng loop, tránh idle rAF
                isAnimating = false;
            }
        };

        // ── Event handlers ───────────────────────────────────────
        const onMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastMoveTime < MOVE_THROTTLE_MS) return;
            lastMoveTime = now;
            acquireRipple(e.clientX, e.clientY, false);
            startAnimating();
        };

        const onClick = (e: MouseEvent) => {
            acquireRipple(e.clientX, e.clientY, true);
            startAnimating();
        };

        const onTouchMove = (e: TouchEvent) => {
            const now = Date.now();
            if (now - lastMoveTime < MOVE_THROTTLE_MS) return;
            lastMoveTime = now;
            if (e.touches[0]) {
                acquireRipple(e.touches[0].clientX, e.touches[0].clientY, false);
                startAnimating();
            }
        };

        // Dừng animation khi tab ẩn — tiết kiệm CPU/GPU đáng kể
        const onVisibilityChange = () => {
            isTabVisible = !document.hidden;
            if (!isTabVisible) {
                cancelAnimationFrame(animFrameId);
                isAnimating = false;
            }
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('click', onClick, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            cancelAnimationFrame(animFrameId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('click', onClick);
            window.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{
                zIndex: 0,
                opacity: 1,
                willChange: 'transform', // GPU compositing layer riêng
            }}
        />
    );
}
