import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BottomSheet({ 
    isOpen, 
    onClose, 
    title, 
    children,
    height = "auto"
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    />
                    
                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, info) => {
                            if (info.offset.y > 100) {
                                onClose();
                            }
                        }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden"
                        style={{ 
                            height: height === "auto" ? "auto" : height,
                            maxHeight: "90vh"
                        }}
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                        </div>

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="h-8 w-8 rounded-full"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(90vh - 100px)" }}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}