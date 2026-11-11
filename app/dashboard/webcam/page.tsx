"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { motion } from "framer-motion";
import { Camera, StopCircle, RefreshCcw, Cpu, Video, Brain, Languages, Sparkles, CheckCircle2, Save, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useSpeech } from "@/hooks/use-speech";

const LANGUAGES = [
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Korean", "Russian", "Arabic", "Portuguese",
    "Italian", "Hindi", "Bengali", "Turkish", "Dutch", "Polish", "Vietnamese", "Thai", "Swedish", "Greek",
    "Czech", "Danish", "Finnish", "Hungarian", "Norwegian", "Romanian", "Slovak", "Indonesian", "Malay", "Filipino",
    "Tamil", "Telugu", "Kannada", "Malayalam", "Gujarati", "Marathi", "Punjabi", "Urdu", "Persian", "Hebrew",
    "Lao", "Burmese", "Khmer", "Tibetan", "Mongolian", "Kazakh", "Uzbek", "Georgian", "Armenian", "Azerbaijani",
    "Basque", "Catalan", "Croatian", "Estonian", "Icelandic", "Latvian", "Lithuanian", "Serbian", "Slovenian", "Ukrainian"
];

export default function WebcamPage() {
    const webcamRef = useRef<Webcam>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string>("");
    const [selectedLanguage, setSelectedLanguage] = useState("English");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [intelligence, setIntelligence] = useState<null | {
        object: string;
        explanation: string;
        translation: {
            object: string;
            explanation: string;
        };
        detected_lang?: string;
        used_model?: string;
        deep_info?: string;
        examples?: string[];
    }>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const { speak } = useSpeech();

    const handleDevices = useCallback((mediaDevices: MediaDeviceInfo[]) => {
        const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
        setDevices(videoDevices);
    }, []);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);

    const captureAndAnalyze = async (isDeep: boolean = false) => {
        if (!webcamRef.current) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const video = webcamRef.current.video;
            // Loosen readyState check. 0 = HAVE_NOTHING. If > 0, we can likely capture.
            if (!video || video.readyState === 0) {
                throw new Error("Webcam data not ready for capture. Please wait a moment and try again.");
            }

            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) throw new Error("Could not capture image from webcam");

            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: imageSrc,
                    targetLanguage: selectedLanguage,
                    deepSearch: isDeep
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setIntelligence(data);
            setHasSaved(false); // Reset save state for new capture

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            console.error("Analysis error:", err);
            setError(errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const saveIntelligence = async () => {
        if (!intelligence) return;

        setIsSaving(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            let userId = session?.user?.id;
            if (session) {
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user?.id) userId = userData.user.id;
            }

            if (!userId) {
                throw new Error("You must be logged in to save intelligence.");
            }


            const { error: dbError } = await supabase.from('detections').insert({
                file_path: 'webcam_capture',
                file_type: 'image',
                objects_detected: [{ label: intelligence.object }],
                accuracy: 0.99,
                latency: 1.5,
                user_id: userId
            });

            if (dbError) throw dbError;

            setHasSaved(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save intelligence.";
            console.error("Save error:", err);
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleScan = () => {
        const newState = !isScanning;
        setIsScanning(newState);
        if (!newState) {
            setIntelligence(null);
            setError(null);
            setHasSaved(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-[-0.05em] bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary uppercase drop-shadow-[0_0_15px_rgba(255,0,128,0.3)]">
                        AI VISION INTELLIGENCE
                    </h1>
                    <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-primary to-transparent rounded-full mt-2 mb-3 opacity-50"></div>
                    <p className="text-white/40 text-[8px] md:text-[10px] font-mono uppercase tracking-[0.2em] md:tracking-[0.3em] font-black italic">
                        Advanced Visual Recognition & Translation
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 glass px-4 py-2 rounded-2xl border-white/5">
                        <Languages className="w-4 h-4 text-secondary" />
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger className="w-[160px] bg-transparent border-none focus:ring-0 text-sm font-bold uppercase tracking-wider">
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/10 bg-black/90 text-white max-h-[300px]">
                                {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang} value={lang} className="hover:bg-primary/20 cursor-pointer">
                                        {lang}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        {devices.length > 1 && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    const currentId = activeDeviceId || (devices[0] && devices[0].deviceId);
                                    if (!currentId) return;
                                    const idx = devices.findIndex(d => d.deviceId === currentId);
                                    setActiveDeviceId(devices[(idx + 1) % devices.length].deviceId);
                                }}
                                className="rounded-xl glass border-white/10 hover:border-secondary/50"
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            onClick={toggleScan}
                            className={`${isScanning ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30' : 'bg-primary text-white shadow-[0_0_20px_rgba(255,0,128,0.4)] hover:bg-primary/90'} border h-12 px-6 rounded-2xl transition-all font-bold tracking-widest`}
                        >
                            {isScanning ? (
                                <>
                                    <StopCircle className="w-5 h-5 mr-2" />
                                    HALT UPLINK
                                </>
                            ) : (
                                <>
                                    <Camera className="w-5 h-5 mr-2" />
                                    INITIALIZE FEED
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Main Feed */}
                <Card className="lg:col-span-3 glass-card border-white/5 overflow-hidden relative h-[400px] lg:h-[600px] flex items-center justify-center bg-black/60 shadow-2xl transition-all duration-500">
                    {!isScanning ? (
                        <div className="text-center space-y-6">
                            <div className="p-8 rounded-full bg-white/5 border border-white/10 inline-block relative">
                                <Video className="w-16 h-16 text-gray-800" />
                                <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping opacity-20"></div>
                            </div>
                            <div>
                                <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">Standby / Neutral Zone</p>
                                <p className="text-gray-700 text-[10px] mt-2 font-mono italic">Waiting for connection handshake...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center group">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={1}
                                forceScreenshotSourceSize={true}
                                videoConstraints={activeDeviceId ? { deviceId: activeDeviceId } : { facingMode: "user" }}
                                onUserMedia={() => {
                                    navigator.mediaDevices.enumerateDevices().then(handleDevices);
                                }}
                                onUserMediaError={(err) => {
                                    console.error("Webcam error:", err);
                                    setError("Camera access denied. Please click the lock icon in your URL bar and allow Camera access.");
                                }}
                                className="w-full h-full object-cover grayscale-[0.3] brightness-90 group-hover:grayscale-0 transition-all duration-700"
                            />

                            {/* Scanning Overlay */}
                            <motion.div
                                className="absolute top-0 left-0 w-full h-[2px] bg-primary/50 shadow-[0_0_20px_#ff0080] z-30"
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            />

                            {/* HUD Overlays */}
                            <div className="absolute inset-x-0 bottom-0 p-8 flex justify-between items-center z-20 pointer-events-none">
                                <div className="hidden sm:block space-y-1">
                                    <div className="flex gap-1 mb-2">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="w-1 h-4 bg-primary/40 rounded-full"></div>
                                        ))}
                                    </div>
                                    <div className="text-[9px] font-mono text-primary/60 tracking-widest font-black uppercase">Neural Interface Active</div>
                                </div>

                                <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto scale-90 sm:scale-100">
                                    <Button
                                        onClick={() => captureAndAnalyze(false)}
                                        disabled={isAnalyzing}
                                        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white text-black border-4 border-white/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-2xl group/btn overflow-hidden"
                                    >
                                        {isAnalyzing ? (
                                            <RefreshCcw className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-black group-hover/btn:scale-110 transition-transform"></div>
                                        )}
                                        <p className="absolute -bottom-10 text-[8px] font-black text-white/40 tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity">QUICK SCAN</p>
                                    </Button>

                                    <Button
                                        onClick={() => captureAndAnalyze(true)}
                                        disabled={isAnalyzing}
                                        className="h-16 w-36 sm:h-20 sm:w-44 rounded-2xl bg-primary text-white border-2 border-primary/20 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,0,128,0.4)] group/deep overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-accent to-secondary opacity-50 group-hover/deep:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 sm:mb-1 group-hover/deep:animate-pulse" />
                                            <span className="text-[9px] sm:text-[10px] font-black tracking-[0.1em] sm:tracking-[0.2em] uppercase">Deep Search</span>
                                        </div>
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
                                    </Button>
                                </div>

                                <div className="text-right">
                                    <div className="text-[14px] font-mono text-white/50 leading-none mb-1">DATASTREAM 001</div>
                                    <div className="text-[9px] font-mono text-secondary/60 tracking-widest font-black uppercase">Global Uplink Ready</div>
                                </div>
                            </div>

                            {/* HUD Corners */}
                            <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-primary/50"></div>
                            <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-primary/50"></div>
                            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-primary/50"></div>
                            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-primary/50"></div>
                        </div>
                    )}
                </Card>

                {/* Sidebar Intelligence */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card border-white/5 p-4 md:p-6 h-[500px] lg:h-[600px] flex flex-col relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>

                        <div className="flex items-center gap-2 mb-8 text-primary shrink-0">
                            <Brain className="w-5 h-5 animate-pulse" />
                            <h3 className="font-bold text-sm tracking-widest uppercase">AI Intelligence</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                            {error && (
                                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-mono">
                                    {error === "OpenRouter API Key not configured"
                                        ? "API ERROR: System key missing. Please check configurations."
                                        : `ERROR: ${error}`}
                                </div>
                            )}

                            {!intelligence ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-4">
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-gray-800" />
                                    </div>
                                    <p className="text-gray-600 text-[10px] font-mono leading-relaxed uppercase tracking-widest">
                                        Initialize feed and press the shutter to begin deep object analysis and real-time translation.
                                    </p>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-8"
                                >
                                    {/* Original Data */}
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-black">Detected Source</label>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 relative group/item">
                                            <div className="text-xl font-bold text-white mb-1">{intelligence.object}</div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed font-mono italic">{intelligence.explanation}</p>
                                            <button
                                                onClick={() => speak(`${intelligence.object}. ${intelligence.explanation}`, "English")}
                                                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-primary/20 text-primary"
                                            >
                                                <Volume2 className="w-3 h-3" />
                                            </button>
                                            {intelligence.detected_lang && (
                                                <div className="mt-4 inline-flex items-center gap-2 text-[9px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 uppercase font-bold">
                                                    Source: {intelligence.detected_lang}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Translation Data */}
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-mono text-secondary uppercase tracking-widest font-black flex items-center gap-2">
                                            <Languages className="w-3 h-3" />
                                            {selectedLanguage} Translation
                                        </label>
                                        <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/20 border-dashed relative group/item">
                                            <div className="text-xl font-bold text-secondary mb-1">{intelligence.translation.object}</div>
                                            <p className="text-[11px] text-gray-300 leading-relaxed font-mono">{intelligence.translation.explanation}</p>
                                            <button
                                                onClick={() => speak(`${intelligence.translation.object}. ${intelligence.translation.explanation}`, selectedLanguage)}
                                                className="absolute top-4 right-4 p-2 rounded-lg bg-secondary/5 border border-secondary/20 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-secondary/20 text-secondary"
                                            >
                                                <Volume2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Deep Info */}
                                    {intelligence.deep_info && (
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-mono text-accent uppercase tracking-widest font-black flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" />
                                                Deep Intelligence
                                            </label>
                                            <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20">
                                                <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
                                                    {intelligence.deep_info}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Examples */}
                                    {intelligence.examples && intelligence.examples.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-mono text-primary uppercase tracking-widest font-black flex items-center gap-2">
                                                <Brain className="w-3 h-3" />
                                                Contextual Examples
                                            </label>
                                            <div className="space-y-2">
                                                {intelligence.examples.map((ex, i) => (
                                                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-mono text-gray-400">
                                                        {ex}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual Save Button */}
                                    <div className="pt-4 border-t border-white/5">
                                        <Button
                                            onClick={saveIntelligence}
                                            disabled={isSaving || hasSaved}
                                            className={`w-full h-12 rounded-xl border flex items-center justify-center font-bold tracking-widest uppercase text-[10px] transition-all ${hasSaved
                                                ? "bg-green-500/10 border-green-500/20 text-green-500"
                                                : "bg-[#040406]/50 border-white/10 text-white hover:bg-white/5"
                                                }`}
                                        >
                                            {isSaving ? (
                                                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : hasSaved ? (
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-2" />
                                            )}
                                            {isSaving ? "SAVING NODE..." : hasSaved ? "DATA ARCHIVED" : "SAVE OBJECT"}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between text-[10px] font-mono text-gray-600 mb-4">
                                <span>PROCESSING NODE</span>
                                <span className="text-primary font-black">
                                    {intelligence?.used_model ? intelligence.used_model.split('/').pop()?.toUpperCase() : "GEMINI-2.0-FLASH-FREE"}
                                </span>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                                <Cpu className="w-4 h-4 text-primary animate-spin-slow" />
                                <span className="text-[9px] font-mono text-primary font-black uppercase tracking-widest leading-none">
                                    {isAnalyzing ? "Processing Matrix..." : "Neural Engine Ready"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

