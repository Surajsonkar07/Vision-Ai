import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const NetworkScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // Create a pulsing effect
    const pulse = Math.sin(frame / 10) * 0.5 + 0.5;

    // Rotate the entire scene slowly
    const rotation = (frame / fps) * 20;

    // Generate some nodes
    const nodes = new Array(15).fill(0).map((_, i) => {
        // Stagger animations
        const delay = i * 5;
        const progress = Math.max(0, frame - delay);

        // Spring animation for appearing
        const scale = spring({
            fps,
            frame: progress,
            config: { damping: 12 },
        });

        // Circular layout
        const radius = 150 + Math.sin(i * 123) * 50;
        const angle = (i / 15) * Math.PI * 2;

        const x = Math.cos(angle) * radius + width / 2;
        const y = Math.sin(angle) * radius + height / 2;

        return { id: i, x, y, scale };
    });

    return (
        <AbsoluteFill style={{ backgroundColor: "transparent", justifyContent: "center", alignItems: "center" }}>
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transform: `rotate(${rotation}deg)`,
                }}
            >
                {/* Draw lines between nodes */}
                {nodes.map((node, i) => {
                    const nextNode = nodes[(i + 1) % nodes.length];
                    const distance = Math.sqrt(Math.pow(nextNode.x - node.x, 2) + Math.pow(nextNode.y - node.y, 2));
                    const angle = Math.atan2(nextNode.y - node.y, nextNode.x - node.x);

                    // Animated line drawing
                    const lineProgress = spring({
                        fps,
                        frame: Math.max(0, frame - 30 - i * 2),
                        config: { damping: 20 }
                    });

                    return (
                        <div
                            key={`line-${i}`}
                            style={{
                                position: "absolute",
                                left: node.x,
                                top: node.y,
                                width: distance * lineProgress,
                                height: 1,
                                backgroundColor: `rgba(0, 255, 255, ${0.1 + pulse * 0.2})`,
                                transformOrigin: "left center",
                                transform: `rotate(${angle}rad)`,
                            }}
                        />
                    );
                })}

                {/* Draw nodes */}
                {nodes.map((node) => (
                    <div
                        key={`node-${node.id}`}
                        style={{
                            position: "absolute",
                            left: node.x,
                            top: node.y,
                            width: 20,
                            height: 20,
                            marginTop: -10,
                            marginLeft: -10,
                            borderRadius: "50%",
                            backgroundColor: node.id % 2 === 0 ? "#FF0080" : "#00FFFF",
                            boxShadow: `0 0 ${20 + pulse * 20}px ${node.id % 2 === 0 ? "#FF0080" : "#00FFFF"}`,
                            transform: `scale(${node.scale * (1 + pulse * 0.2)})`,
                            opacity: node.scale,
                        }}
                    >
                        <div style={{
                            position: "absolute",
                            inset: 2,
                            backgroundColor: "#000",
                            borderRadius: "50%",
                        }} />
                    </div>
                ))}

                {/* Center core */}
                <div style={{
                    position: "absolute",
                    left: width / 2 - 40,
                    top: height / 2 - 40,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    backgroundColor: `rgba(112, 0, 255, ${0.2 + pulse * 0.3})`,
                    boxShadow: `0 0 ${40 + pulse * 40}px #7000ff`,
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    transform: `scale(${spring({ fps, frame: Math.max(0, frame - 10), config: { damping: 15 } })})`
                }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: "#000",
                        boxShadow: "inset 0 0 20px #7000ff"
                    }} />
                </div>
            </div>
        </AbsoluteFill>
    );
};
