"use client";

import React, { useRef, useState } from "react";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";

interface TiltWrapperProps {
    children: React.ReactNode;
    className?: string;
    maxTilt?: number;
    scale?: number;
    perspective?: number;
    glareEnable?: boolean;
}

export const TiltWrapper: React.FC<TiltWrapperProps> = ({
    children,
    className = "",
    maxTilt = 15,
    scale = 1.05,
    perspective = 1000,
    glareEnable = true,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const rotateX = useTransform(springY, [-0.5, 0.5], [maxTilt, -maxTilt]);
    const rotateY = useTransform(springX, [-0.5, 0.5], [-maxTilt, maxTilt]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);

        // Calculate glare percentage based on mouse position
        if (glareEnable) {
            setGlarePosition({
                x: (mouseX / width) * 100,
                y: (mouseY / height) * 100
            });
        }
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        x.set(0);
        y.set(0);
    };

    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    return (
        <motion.div
            ref={ref}
            className={`relative ${className}`}
            style={{
                perspective: `${perspective}px`,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            whileHover={{ scale }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                    borderRadius: "inherit",
                }}
                className="w-full h-full relative"
            >
                {children}

                {glareEnable && (
                    <div
                        className="absolute inset-0 pointer-events-none overflow-hidden"
                        style={{
                            opacity: isHovering ? 0.8 : 0,
                            transition: "opacity 0.4s ease",
                            borderRadius: "inherit",
                        }}
                    >
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)`,
                                transform: 'translateZ(1px)', // slight pop forward for the glare
                            }}
                        />
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};
