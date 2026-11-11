"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Eye, EyeOff, KeyRound, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Spline from '@splinetool/react-spline';

export default function SignupPage() {
    const [step, setStep] = useState<"form" | "otp">("form");
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otpCode, setOtpCode] = useState("");

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    // Clean Refresh Handling & Session Check
    useEffect(() => {
        const checkSession = async () => {
            // Always check getSession() BEFORE getUser() to suppress AuthSessionMissingError toasts
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    router.push("/dashboard");
                    return;
                }
            }
            // Reset to clean initial state if unverified or missing session
            setStep("form");
            setError(null);
            setInfoMessage(null);
        };

        checkSession();
    }, [router, supabase.auth]);

    // Step 1: Request Pre-Signup 6-digit OTP Code (NO Early User Creation in Supabase)
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setInfoMessage(null);

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    fullName,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send verification email.");
            }

            setStep("otp");
            setInfoMessage(`We sent a 6-digit verification code to ${email}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to send verification code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Resend 6-digit OTP Code
    const handleResendOtp = async () => {
        setResending(true);
        setError(null);
        setInfoMessage(null);

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    fullName,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to resend code.");
            }

            setInfoMessage(`A new 6-digit code has been sent to ${email}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to resend verification code.");
        } finally {
            setResending(false);
        }
    };

    // Step 3: Verify OTP Code & Create User Account
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!otpCode || otpCode.trim().length !== 6) {
            setError("Please enter the complete 6-digit numeric OTP code.");
            setLoading(false);
            return;
        }

        try {
            // 1. Call verify-email API route (validates token, creates user in Supabase Auth, upserts profile, deletes token)
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    code: otpCode.trim(),
                    password,
                    fullName,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Verification failed. Please check your 6-digit code.");
            }

            // 2. Auto sign-in the user via client signInWithPassword()
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                throw signInError;
            }

            // 3. Redirect to dashboard
            router.push("/dashboard");
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
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
                    <CardHeader className="space-y-1 text-center pb-6 border-b border-white/5">
                        <CardTitle className="text-3xl font-black tracking-tighter uppercase text-secondary">
                            {step === "form" ? "Sign Up" : "Email Verification"}
                        </CardTitle>
                        {step === "otp" && (
                            <CardDescription className="text-gray-400 font-mono text-xs uppercase tracking-widest pt-1">
                                Enter the 6-digit OTP code sent to your inbox
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6">
                        {error && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-mono text-center">
                                {error}
                            </div>
                        )}

                        {infoMessage && !error && (
                            <div className="mb-6 p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary text-xs font-mono text-center flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{infoMessage}</span>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {step === "form" ? (
                                <motion.form
                                    key="signup-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleRequestOtp}
                                    autoComplete="off"
                                    className="space-y-5"
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1">Full Name</Label>
                                            <Input
                                                type="text"
                                                placeholder="Agent Neo"
                                                required
                                                autoComplete="off"
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
                                                autoComplete="off"
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
                                                autoComplete="off"
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
                                                minLength={6}
                                                autoComplete="new-password"
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
                                                CONTINUE & SEND CODE
                                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="otp-form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleVerifyOtp}
                                    autoComplete="off"
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl text-center">
                                            <Mail className="w-8 h-8 text-secondary mx-auto mb-2 opacity-80" />
                                            <p className="text-xs text-gray-400 font-mono">Verification email dispatched to</p>
                                            <p className="text-sm font-bold text-white font-mono mt-0.5">{email}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1 flex items-center gap-1.5">
                                                <KeyRound className="w-3.5 h-3.5 text-secondary" />
                                                6-Digit OTP Verification Code
                                            </Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={6}
                                                placeholder="849201"
                                                required
                                                autoFocus
                                                autoComplete="off"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                                className="h-14 bg-white/5 border-white/10 text-white font-mono text-center text-2xl tracking-[0.5em] placeholder:text-gray-700 placeholder:tracking-normal focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 rounded-xl px-4"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading || otpCode.length !== 6}
                                        className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,195,255,0.3)] transition-all flex items-center justify-center group disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                VERIFY & CREATE ACCOUNT
                                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>

                                    <div className="pt-2 flex items-center justify-between text-xs font-mono text-gray-400">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep("form");
                                                setOtpCode("");
                                                setError(null);
                                                setInfoMessage(null);
                                            }}
                                            className="flex items-center text-gray-400 hover:text-white transition-colors"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit Email
                                        </button>

                                        <button
                                            type="button"
                                            disabled={resending}
                                            onClick={handleResendOtp}
                                            className="text-secondary hover:underline disabled:opacity-50 font-bold"
                                        >
                                            {resending ? "Resending..." : "Resend Code"}
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
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
