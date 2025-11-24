import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SlidePreview({ slides }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const nextSlide = () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else if (isPlaying) {
            setCurrentIndex(0); // Loop back to start when auto-playing
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const toggleAutoPlay = () => {
        setIsPlaying(!isPlaying);
    };

    // Auto-advance slides when playing
    React.useEffect(() => {
        if (!isPlaying) return;
        
        const timer = setInterval(() => {
            setCurrentIndex(prev => {
                if (prev < slides.length - 1) {
                    return prev + 1;
                } else {
                    return 0; // Loop back
                }
            });
        }, 5000); // 5 seconds per slide

        return () => clearInterval(timer);
    }, [isPlaying, slides.length]);

    const currentSlide = slides[currentIndex];

    return (
        <div className="max-w-2xl mx-auto">
            <div className="relative bg-slate-100 rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: '9/16', maxHeight: '600px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex flex-col p-8"
                        style={{
                            backgroundColor: currentSlide.background_color,
                            color: currentSlide.text_color
                        }}
                    >
                        {/* Media */}
                        {currentSlide.media_url && currentSlide.media_type === 'image' && (
                            <div className="flex-1 flex items-center justify-center mb-6">
                                <img 
                                    src={currentSlide.media_url} 
                                    alt={currentSlide.title}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            </div>
                        )}
                        {currentSlide.media_url && currentSlide.media_type === 'video' && (
                            <div className="flex-1 flex items-center justify-center mb-6">
                                <video 
                                    src={currentSlide.media_url} 
                                    controls
                                    className="max-w-full max-h-full rounded-lg"
                                    playsInline
                                />
                            </div>
                        )}
                        {currentSlide.media_url && currentSlide.media_type === 'audio' && (
                            <div className="flex-1 flex items-center justify-center mb-6">
                                <audio 
                                    src={currentSlide.media_url} 
                                    controls
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div className="space-y-4">
                            {currentSlide.title && (
                                <h2 className="text-3xl font-bold">{currentSlide.title}</h2>
                            )}
                            {currentSlide.body_text && (
                                <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                    {currentSlide.body_text}
                                </p>
                            )}
                        </div>

                        {/* CTA Button */}
                        {currentSlide.cta_text && (
                            <div className="mt-auto pt-6">
                                <Button 
                                    className="w-full py-6 text-lg font-semibold"
                                    style={{
                                        backgroundColor: currentSlide.text_color,
                                        color: currentSlide.background_color
                                    }}
                                >
                                    {currentSlide.cta_text}
                                </Button>
                            </div>
                        )}

                        {/* Slide Indicators */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className="w-2 h-2 rounded-full transition-all"
                                    style={{
                                        backgroundColor: index === currentIndex ? currentSlide.text_color : 'rgba(255,255,255,0.3)'
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                {currentIndex > 0 && (
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={prevSlide}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                )}
                {currentIndex < slides.length - 1 && (
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={nextSlide}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>
                )}

                {/* Auto-play control */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                    onClick={toggleAutoPlay}
                >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
            </div>

            <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-slate-600">Slide {currentIndex + 1} of {slides.length}</p>
                <p className="text-xs text-slate-500">
                    {isPlaying ? '▶ Auto-playing' : 'Click play to auto-advance slides'}
                </p>
            </div>
        </div>
    );
}