import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function MultiSelect({
    options = [],
    selected = [],
    onChange,
    placeholder = "Select items...",
    className
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (value) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const handleRemove = (value) => {
        onChange(selected.filter((item) => item !== value));
    };

    const filteredOptions = options.filter((option) => {
        const optionStr = typeof option === 'object' ? option.label || option.value : option;
        return String(optionStr).toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <div
                className={cn(
                    "flex min-h-10 w-full flex-wrap gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer",
                    isOpen && "ring-2 ring-slate-950 ring-offset-2"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selected.length > 0 ? (
                    <>
                        {selected.map((value) => {
                            const option = options.find(o => 
                                typeof o === 'object' ? o.value === value : o === value
                            );
                            const displayLabel = typeof option === 'object' ? option.label : (option || value);
                            return (
                                <Badge
                                    key={value}
                                    variant="secondary"
                                    className="flex items-center gap-1 px-2 py-1"
                                >
                                    <span>{displayLabel}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(value);
                                        }}
                                        className="ml-1 hover:text-red-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            );
                        })}
                    </>
                ) : (
                    <span className="text-slate-500">{placeholder}</span>
                )}
                <ChevronDown className={cn(
                    "ml-auto h-4 w-4 text-slate-500 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                    <div className="p-2 border-b border-slate-200">
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-8"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                                No options found
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const optionValue = typeof option === 'object' ? option.value : option;
                                const optionLabel = typeof option === 'object' ? option.label : option;
                                const isSelected = selected.includes(optionValue);
                                return (
                                    <div
                                        key={optionValue}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(optionValue);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-sm cursor-pointer transition-colors",
                                            "hover:bg-slate-100",
                                            isSelected && "bg-slate-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-4 w-4 rounded-sm border border-slate-300 flex items-center justify-center",
                                            isSelected && "bg-slate-900 border-slate-900"
                                        )}>
                                            {isSelected && (
                                                <Check className="h-3 w-3 text-white" />
                                            )}
                                        </div>
                                        <span className="text-sm">{optionLabel}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}