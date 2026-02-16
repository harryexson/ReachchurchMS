import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NativeHeader({ title, showBack = true, rightAction }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 safe-area-inset-top">
      <div className="flex items-center justify-between px-4 h-14">
        {showBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-900 dark:text-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <div className="w-10" />
        )}
        
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
          {title}
        </h1>
        
        {rightAction || <div className="w-10" />}
      </div>
    </header>
  );
}