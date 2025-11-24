import React, { useState, useEffect, useCallback } from "react";
import { GenerateImage } from "@/integrations/Core";
import { ChurchSettings } from "@/entities/ChurchSettings";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export default function LogoGenerator() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const updateSettingsWithLogo = async (url) => {
        try {
            const settingsList = await ChurchSettings.list();
            if (settingsList.length > 0) {
                await ChurchSettings.update(settingsList[0].id, { logo_url: url });
            } else {
                await ChurchSettings.create({ church_name: "My Church", logo_url: url });
            }
        } catch (error) {
            console.error("Failed to save logo URL to settings:", error);
        }
    };

    const generateLogo = useCallback(async () => {
        setIsGenerating(true);
        try {
            const result = await GenerateImage({
                prompt: "Create a contemporary, modern logo for 'REACH ChurchConnect' church management software. Design should feature clean typography with 'REACH' prominently displayed, incorporating subtle church/community connection elements like interconnected circles or gentle cross symbolism. Use a professional color palette of navy blue and gold/amber accents. The logo should work well at small sizes, be minimalist and sophisticated, suitable for a premium church technology platform. Style should be clean, modern, and trustworthy - not overly religious but spiritually inspired."
            });
            if (result && result.url) {
                setLogoUrl(result.url);
                if (isAuthenticated) {
                    await updateSettingsWithLogo(result.url);
                }
            } else {
                throw new Error("Invalid response from image generation service.");
            }
        } catch (error) {
            console.error("Failed to generate logo:", error);
        } finally {
            setIsGenerating(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const loadLogo = async () => {
            setIsLoading(true);
            try {
                // Check if user is authenticated
                const user = await User.me();
                setIsAuthenticated(true);
                
                // Try to load existing logo from settings
                const settingsList = await ChurchSettings.list();
                if (settingsList.length > 0 && settingsList[0].logo_url) {
                    setLogoUrl(settingsList[0].logo_url);
                } else {
                    // No logo found, generate one
                    await generateLogo();
                }
            } catch (error) {
                // User not authenticated or error loading settings
                // This is fine for public pages - just show fallback logo
                setIsAuthenticated(false);
                console.log("User not authenticated or settings unavailable - using fallback logo");
            } finally {
                setIsLoading(false);
            }
        };

        loadLogo();
    }, [generateLogo]);

    // Show loading spinner only briefly
    if (isLoading || isGenerating) {
        return (
            <div className="flex items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <div>
                    <div className="font-bold text-slate-900 text-lg">REACH</div>
                    <p className="text-xs text-slate-500 font-medium">ChurchConnect</p>
                </div>
            </div>
        );
    }

    // Show logo if available
    if (logoUrl) {
        return (
            <div className="flex items-center justify-between w-full">
                 <div className="flex items-center gap-3">
                    <img 
                        src={logoUrl} 
                        alt="REACH ChurchConnect Logo" 
                        className="w-10 h-10 object-contain rounded-lg"
                    />
                    <div>
                        <div className="font-bold text-slate-900 text-lg">REACH</div>
                        <p className="text-xs text-slate-500 font-medium">ChurchConnect</p>
                    </div>
                </div>
                 {isAuthenticated && (
                    <Button variant="ghost" size="icon" onClick={generateLogo} title="Generate new logo">
                        <RefreshCw className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                    </Button>
                 )}
            </div>
        );
    }

    // Fallback UI with default branding
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">R</span>
                </div>
                <div>
                    <div className="font-bold text-slate-900 text-lg">REACH</div>
                    <p className="text-xs text-slate-500 font-medium">ChurchConnect</p>
                </div>
            </div>
            {isAuthenticated && (
                <Button variant="ghost" size="icon" onClick={generateLogo} title="Generate logo">
                    <RefreshCw className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                </Button>
            )}
        </div>
    );
}