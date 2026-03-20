"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Eye, EyeOff, ScanLine } from "lucide-react";
import Link from "next/link";
import Spline from '@splinetool/react-spline';

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            router.push("/dashboard");
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#040406] flex items-center justify-center p-4 relative overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
                <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
            </div>
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
                    <ScanLine className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-2xl font-black tracking-tighter text-white">VISION<span className="text-primary">.AI</span></span>
                </Link>

                <Card className="glass-card border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
                    <CardHeader className="space-y-1 text-center pb-8 border-b border-white/5">
                        <CardTitle className="text-3xl font-black tracking-tighter uppercase">Welcome Back</CardTitle>
                        <CardDescription className="text-gray-400 font-mono text-xs uppercase tracking-widest">
                            Enter your email below to login to your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-mono text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1">Email Address</Label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4"
                                />
                            </div>

                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1">Password</Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl px-4 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,128,0.3)] transition-all flex items-center justify-center mt-4 group"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        SIGN IN
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center mt-8 text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-primary hover:underline hover:text-primary/80 transition-colors font-bold">
                        Sign Up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
