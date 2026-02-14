import React, { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

export default function SwipeableCard({ 
    children, 
    onSwipeLeft,
    onSwipeRight,
    leftAction = { icon: null, color: "bg-red-500", label: "Delete" },
    rightAction = { icon: null, color: "bg-green-500", label: "Complete" },
    className = ""
}) {
    const x = useMotionValue(0);
    const [swiping, setSwiping] = useState(false);

    const leftBg = useTransform(x, [-100, 0], [1, 0]);
    const rightBg = useTransform(x, [0, 100], [0, 1]);

    const handleDragEnd = (event, info) => {
        setSwiping(false);
        
        if (info.offset.x < -100 && onSwipeLeft) {
            onSwipeLeft();
        } else if (info.offset.x > 100 && onSwipeRight) {
            onSwipeRight();
        }
        
        x.set(0);
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Left action background */}
            {onSwipeLeft && (
                <motion.div
                    style={{ opacity: leftBg }}
                    className={`absolute inset-y-0 right-0 ${leftAction.color} flex items-center justify-end px-6`}
                >
                    {leftAction.icon && <leftAction.icon className="w-6 h-6 text-white" />}
                </motion.div>
            )}
            
            {/* Right action background */}
            {onSwipeRight && (
                <motion.div
                    style={{ opacity: rightBg }}
                    className={`absolute inset-y-0 left-0 ${rightAction.color} flex items-center justify-start px-6`}
                >
                    {rightAction.icon && <rightAction.icon className="w-6 h-6 text-white" />}
                </motion.div>
            )}

            {/* Card content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                style={{ x }}
                onDragStart={() => setSwiping(true)}
                onDragEnd={handleDragEnd}
                className={`bg-white ${swiping ? 'cursor-grabbing' : ''}`}
            >
                {children}
            </motion.div>
        </div>
    );
}