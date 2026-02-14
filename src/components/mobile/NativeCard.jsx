import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function NativeCard({ 
    children, 
    className = "", 
    onTap, 
    pressable = true,
    ...props 
}) {
    return (
        <motion.div
            whileTap={pressable ? { scale: 0.98 } : {}}
            onClick={onTap}
            className={className}
        >
            <Card 
                className={`shadow-md hover:shadow-lg transition-all duration-200 border-0 ${
                    pressable ? 'active:shadow-sm cursor-pointer' : ''
                }`}
                {...props}
            >
                {children}
            </Card>
        </motion.div>
    );
}