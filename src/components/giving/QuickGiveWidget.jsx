import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuickGiveWidget({ onQuickDonate, branding }) {
    const quickAmounts = [25, 50, 100];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-40"
        >
            <Card className="shadow-2xl border-0 overflow-hidden bg-white">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <p className="font-bold text-slate-900">Quick Give</p>
                    </div>
                    <div className="space-y-2">
                        {quickAmounts.map(amt => (
                            <Button
                                key={amt}
                                onClick={() => onQuickDonate(amt)}
                                className="w-full text-lg font-bold shadow-md hover:scale-105 transition-all"
                                style={{
                                    background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)`
                                }}
                            >
                                <Heart className="w-4 h-4 mr-2" />
                                ${amt}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}