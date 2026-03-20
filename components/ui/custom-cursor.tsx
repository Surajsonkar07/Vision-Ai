"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const updateHoverState = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if hovering over clickable elements
            if (
                target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.closest('a') ||
                target.closest('button') ||
                window.getComputedStyle(target).cursor === 'pointer'
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        window.addEventListener("mousemove", updateMousePosition);
        window.addEventListener("mousemove", updateHoverState);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", updateMousePosition);
            window.removeEventListener("mousemove", updateHoverState);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    // Inner dot setup
    const variants = {
        default: {
            x: mousePosition.x - 4,
            y: mousePosition.y - 4,
            scale: 1,
        },
        hover: {
            x: mousePosition.x - 4,
            y: mousePosition.y - 4,
            scale: 0,
        },
        click: {
            x: mousePosition.x - 4,
            y: mousePosition.y - 4,
            scale: 0.5,
        }
    };

    // Outer ring setup
    const ringVariants = {
        default: {
            x: mousePosition.x - 16,
            y: mousePosition.y - 16,
            scale: 1,
            borderColor: "rgba(255, 0, 128, 0.5)", // primary
            backgroundColor: "rgba(0, 0, 0, 0)",
        },
        hover: {
            x: mousePosition.x - 24,
            y: mousePosition.y - 24,
            scale: 1.5,
            borderColor: "rgba(0, 255, 255, 0.8)", // secondary
            backgroundColor: "rgba(0, 255, 255, 0.1)",
        },
        click: {
            x: mousePosition.x - 16,
            y: mousePosition.y - 16,
            scale: 0.8,
            borderColor: "rgba(112, 0, 255, 1)", // accent
            backgroundColor: "rgba(112, 0, 255, 0.2)",
        }
    };

    const currentState = isClicking ? 'click' : isHovering ? 'hover' : 'default';

    return (
        <div className="hidden md:block pointer-events-none fixed inset-0 z-[9999]">
            {/* Outer ring */}
            <motion.div
                className="absolute w-8 h-8 rounded-full border-2 border-primary mix-blend-screen"
                variants={ringVariants}
                animate={currentState}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    mass: 0.5
                }}
            />

            {/* Inner dot */}
            <motion.div
                className="absolute w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_#00ffff]"
                variants={variants}
                animate={currentState}
                transition={{
                    type: "spring",
                    stiffness: 800,
                    damping: 20,
                    mass: 0.1
                }}
            />
        </div>
    );
};
