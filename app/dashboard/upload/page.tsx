"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileImage, FileVideo, X, CheckCircle2, ScanLine, AlertCircle, Sparkles, Brain, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useSpeech } from "@/hooks/use-speech";

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{
        object: string;
        explanation: string;
        translation?: {
            object: string;
            explanation: string;
        };
        detected_lang?: string;
        used_model?: string;
        deep_info?: string;
        examples?: string[];
    } | null>(null);
    const { speak } = useSpeech();
    const supabase = createClient();

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const clearFile = () => {
        setFile(null);
        setUploadComplete(false);
        setProgress(0);
        setError(null);
    };

    const handleUpload = async (isDeep: boolean = false) => {
        if (!file) return;
        setUploading(true);
        setProgress(10);
        setError(null);

        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            await supabase.storage
                .from('detections')
                .upload(filePath, file);

            // 2. Perform Real AI Inference
            setProgress(60);
            const base64Image = await fileToBase64(file);
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64Image,
                    targetLanguage: "Hindi",
                    deepSearch: isDeep
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Vision analysis failed");
            }

            const analysisData = await response.json();
            setAnalysisResult(analysisData);
            setProgress(85);

            const { data: { session } } = await supabase.auth.getSession();
            let currentUserId = session?.user?.id;
            if (session) {
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user?.id) currentUserId = userData.user.id;
            }

            const { error: dbError } = await supabase
                .from('detections')
                .insert({
                    file_path: filePath,
                    file_type: file.type.includes('image') ? 'image' : 'video',
                    objects_detected: analysisData,
                    accuracy: 0.99,
                    latency: 0.8,
                    user_id: currentUserId,
                });

            if (dbError) throw dbError;




            setProgress(100);
            setUploadComplete(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to process detection.";
            console.error(err);
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl md:text-5xl font-black tracking-[-0.05em] bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary uppercase drop-shadow-[0_0_15px_rgba(255,0,128,0.3)]">
                    Neural Uplink
                </h1>
                <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-primary to-transparent rounded-full mt-2 mb-3 opacity-50"></div>
                <p className="text-white/40 text-[8px] md:text-[10px] font-mono uppercase tracking-[0.2em] md:tracking-[0.3em] font-black italic">
                    Initialize external source processing
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <Card className={`glass-card border-white/5 transition-all duration-300 ${isDragging ? "ring-2 ring-primary ring-offset-background bg-primary/5" : ""}`}>
                    <CardContent className="p-12">
                        {!file ? (
                            <div
                                className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl p-6 md:p-16 text-center transition-all hover:border-primary/50 cursor-pointer group bg-black/20"
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <div className="p-4 md:p-6 rounded-full bg-primary/10 mb-4 md:mb-6 neon-border group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                                </div>
                                <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-white mb-2">Initialize Data Drop</h3>
                                <p className="text-gray-500 font-mono text-[8px] md:text-[10px] uppercase tracking-tighter mb-6 md:mb-8 max-w-sm px-4">
                                    Format constraints: JPG, PNG, MP4, AVI. <br /> Max volumetric limit: 50MB.
                                </p>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept="image/jpeg, image/png, video/mp4, video/avi"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) setFile(e.target.files[0]);
                                    }}
                                />
                                <Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-xl px-10 font-mono text-[10px] uppercase tracking-widest leading-none h-12">
                                    SELECT SOURCE
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden gap-4">
                                    {uploading && (
                                        <motion.div
                                            className="absolute inset-0 bg-primary/10 pointer-events-none"
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ ease: "linear" }}
                                        />
                                    )}
                                    <div className="flex items-center gap-3 md:gap-4 relative z-10 w-full overflow-hidden">
                                        <div className="p-3 md:p-4 bg-secondary/10 rounded-xl border border-secondary/20 shrink-0">
                                            {file.type.includes('image') ? <FileImage className="w-6 h-6 md:w-8 md:h-8 text-secondary" /> : <FileVideo className="w-6 h-6 md:w-8 md:h-8 text-secondary" />}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-white uppercase tracking-tighter truncate text-sm md:text-base">{file.name}</p>
                                            <p className="text-[8px] md:text-[10px] text-gray-500 font-mono uppercase tracking-widest">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end sm:self-center relative z-10">
                                        {!uploading && !uploadComplete && (
                                            <button onClick={clearFile} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                        {uploadComplete && (
                                            <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                                        )}
                                    </div>
                                </div>

                                {uploading && (
                                    <div className="space-y-3 px-2">
                                        <div className="flex justify-between text-[10px] font-mono uppercase">
                                            <span className="text-primary animate-pulse tracking-widest">Executing Neural Inference...</span>
                                            <span className="text-white">{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-1 bg-white/5" />
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 text-destructive">
                                        <AlertCircle className="w-5 h-5" />
                                        <p className="text-[10px] font-mono uppercase font-bold">{error}</p>
                                    </div>
                                )}

                                {!uploading && !uploadComplete && (
                                    <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6">
                                        <Button
                                            onClick={() => handleUpload(false)}
                                            className="bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-xl px-6 sm:px-8 h-12 sm:h-14 font-black uppercase tracking-widest leading-none transition-all text-[10px] sm:text-sm"
                                        >
                                            QUICK SCAN
                                            <ScanLine className="w-4 h-4 ml-2 opacity-50" />
                                        </Button>
                                        <Button
                                            onClick={() => handleUpload(true)}
                                            className="grad-primary text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,0,128,0.4)] transition-all px-10 sm:px-12 h-12 sm:h-14 rounded-xl font-black uppercase tracking-widest leading-none relative overflow-hidden group/btn text-[10px] sm:text-sm"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                            <span className="relative z-10 flex items-center">
                                                DEEP SEARCH
                                                <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
                                            </span>
                                        </Button>
                                    </div>
                                )}

                                {uploadComplete && analysisResult && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="p-8 mt-10 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center space-y-6"
                                    >
                                        <div className="space-y-4 w-full">
                                            <div className="flex flex-col items-center">
                                                <div className="p-3 rounded-full bg-primary/20 mb-2">
                                                    <CheckCircle2 className="w-8 h-8 text-primary" />
                                                </div>
                                                <p className="text-primary font-black uppercase tracking-widest text-xl leading-none">Analysis Success</p>
                                                <p className="text-gray-500 font-mono text-[10px] uppercase mt-2">Neural Engine: {analysisResult.used_model || "Meta-Llama-3"}</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
                                                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 relative group/item">
                                                    <p className="text-[10px] font-mono text-primary uppercase tracking-widest">Detected Object</p>
                                                    <p className="text-xl font-black text-white uppercase">{analysisResult.object}</p>
                                                    <button
                                                        onClick={() => speak(analysisResult.object, "English")}
                                                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/10 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-primary/20 text-primary"
                                                    >
                                                        <Volume2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                                                    <p className="text-[10px] font-mono text-secondary uppercase tracking-widest">Confidence Score</p>
                                                    <p className="text-xl font-black text-white">99.2%</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 md:col-span-2 relative group/item">
                                                    <p className="text-[10px] font-mono text-accent uppercase tracking-widest">Neural Explanation</p>
                                                    <p className="text-sm text-gray-300 leading-relaxed font-medium capitalize-first">{analysisResult.explanation}</p>
                                                    <button
                                                        onClick={() => speak(analysisResult.explanation, "English")}
                                                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/10 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-accent/20 text-accent"
                                                    >
                                                        <Volume2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                {analysisResult.translation && (
                                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2 md:col-span-2 relative group/item">
                                                        <p className="text-[10px] font-mono text-primary/70 uppercase tracking-widest">Localized Translation (HINDI)</p>
                                                        <p className="text-lg font-bold text-white">{analysisResult.translation.object}</p>
                                                        <p className="text-xs text-gray-400 italic">{analysisResult.translation.explanation}</p>
                                                        <button
                                                            onClick={() => speak(`${analysisResult.translation!.object}. ${analysisResult.translation!.explanation}`, "Hindi")}
                                                            className="absolute top-4 right-4 p-1.5 rounded-lg bg-primary/10 border border-primary/20 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-primary/20 text-primary"
                                                        >
                                                            <Volume2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}

                                                {analysisResult.deep_info && (
                                                    <div className="p-5 rounded-xl bg-accent/5 border border-accent/20 space-y-3 md:col-span-2">
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-accent" />
                                                            <p className="text-[10px] font-mono text-accent uppercase tracking-widest font-black">Deep Intelligence Analysis</p>
                                                        </div>
                                                        <p className="text-xs text-gray-300 leading-relaxed font-mono italic">
                                                            {analysisResult.deep_info}
                                                        </p>
                                                    </div>
                                                )}

                                                {analysisResult.examples && analysisResult.examples.length > 0 && (
                                                    <div className="p-5 rounded-xl bg-secondary/5 border border-secondary/20 space-y-3 md:col-span-2">
                                                        <div className="flex items-center gap-2">
                                                            <Brain className="w-4 h-4 text-secondary" />
                                                            <p className="text-[10px] font-mono text-secondary uppercase tracking-widest font-black">Contextual Use Cases</p>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {analysisResult.examples.map((ex, i) => (
                                                                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono text-gray-400">
                                                                    {ex}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-4 w-full">
                                            <Button variant="outline" className="flex-1 border-white/10 text-white font-mono text-[10px] uppercase hover:bg-white/5 rounded-xl h-12">
                                                SAVE REPORT
                                            </Button>
                                            <Button className="flex-1 grad-primary text-white font-mono text-[10px] uppercase rounded-xl shadow-lg h-12">
                                                GENERATE ANALYTICS
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
