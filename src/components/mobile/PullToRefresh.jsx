import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
    const [refreshing, setRefreshing] = useState(false);
    const y = useMotionValue(0);
    const rotate = useTransform(y, [0, 100], [0, 360]);
    const opacity = useTransform(y, [0, 50, 100], [0, 0.5, 1]);

    const handleDragEnd = async (event, info) => {
        if (info.offset.y > 100 && !refreshing) {
            setRefreshing(true);
            await onRefresh?.();
            setRefreshing(false);
        }
        y.set(0);
    };

    return (
        <div className="relative">
            <motion.div
                style={{ opacity }}
                className="absolute top-0 left-0 right-0 flex justify-center py-4 z-10"
            >
                <motion.div style={{ rotate }}>
                    <RefreshCw 
                        className={`w-6 h-6 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} 
                    />
                </motion.div>
            </motion.div>
            
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.3}
                style={{ y }}
                onDragEnd={handleDragEnd}
                className={refreshing ? 'pointer-events-none' : ''}
            >
                {children}
            </motion.div>
        </div>
    );
}