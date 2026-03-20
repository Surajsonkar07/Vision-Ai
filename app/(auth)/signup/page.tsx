"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Spline from '@splinetool/react-spline';

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        username,
                        full_name: fullName,
                    }
                }
            });

            if (signUpError) throw signUpError;

            router.push("/dashboard");
            router.refresh();

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to register. Please try again.");
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
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Create Account</h1>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-2">Join Vision AI today</p>
                </div>

                <Card className="glass-card border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
                    <CardHeader className="space-y-1 text-center pb-8 border-b border-white/5">
                        <CardTitle className="text-3xl font-black tracking-tighter uppercase text-secondary">Sign Up</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                            <form onSubmit={handleSignup} className="space-y-6">
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-mono text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1">Full Name</Label>
                                        <Input
                                            type="text"
                                            placeholder="Agent Neo"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 rounded-xl px-4"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1">Username</Label>
                                        <Input
                                            type="text"
                                            placeholder="johndoe"
                                            required
                                            minLength={3}
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 rounded-xl px-4"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1">Email Address</Label>
                                        <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 rounded-xl px-4"
                                        />
                                    </div>
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
                                            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 rounded-xl px-4 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-mono text-gray-600 mt-2 px-1">Must be at least 6 characters.</p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,195,255,0.3)] transition-all flex items-center justify-center mt-4 group"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            CREATE ACCOUNT
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                    </CardContent>
                </Card>

                <p className="text-center mt-8 text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                    Already have an account?{" "}
                    <Link href="/login" className="text-secondary hover:underline hover:text-secondary/80 transition-colors font-bold">
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
