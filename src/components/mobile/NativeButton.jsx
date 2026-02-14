import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function NativeButton({ 
    children, 
    loading = false,
    icon: Icon,
    className = "",
    fullWidth = false,
    ...props 
}) {
    return (
        <motion.div
            whileTap={{ scale: 0.96 }}
            className={fullWidth ? "w-full" : ""}
        >
            <Button
                className={`shadow-md active:shadow-sm transition-all duration-150 font-semibold ${
                    fullWidth ? 'w-full' : ''
                } ${className}`}
                disabled={loading}
                {...props}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                    </>
                ) : (
                    <>
                        {Icon && <Icon className="w-4 h-4 mr-2" />}
                        {children}
                    </>
                )}
            </Button>
        </motion.div>
    );
}