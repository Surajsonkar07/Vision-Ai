"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Database, User, Shield, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<{
        id: string;
        email: string;
        full_name: string;
        username: string;
    } | null>(null);

    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('userid', authUser.id)
                    .single();

                setUser({
                    id: authUser.id,
                    email: authUser.email || "",
                    full_name: profile?.full_name || authUser.user_metadata?.full_name || "",
                    username: profile?.username || authUser.user_metadata?.username || "",
                });
            }
            setLoading(false);
        }

        fetchProfile();
    }, [supabase]);

    const [isEditing, setIsEditing] = useState(false);

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);

        const { error } = await supabase
            .from('profiles')
            .upsert({
                userid: user.id,
                email: user.email,
                full_name: user.full_name,
                username: user.username,
                updated_at: new Date().toISOString(),
                password: '*managed by supabase auth*',
            }, { onConflict: 'userid' });

        if (error) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Profile Updated",
                description: "Your neural identity has been synchronized.",
            });
            setIsEditing(false);
        }
        setSaving(false);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary uppercase">
                    System Configuration
                </h1>
                <p className="text-gray-500 text-sm font-mono mt-1 uppercase tracking-widest">Manage your neural engine preferences</p>
            </motion.div>

            <div className="grid gap-6">
                {/* User Profile Section */}
                <Card className="glass-card border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
                    <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                            <User className="w-5 h-5" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest">User Profile</CardTitle>
                        </div>
                        {!loading && !isEditing && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="text-[10px] font-mono text-primary hover:bg-primary/10 px-3 h-8 border border-primary/20"
                            >
                                <Shield className="w-3 h-3 mr-2" /> EDIT IDENTITY
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-10 bg-white/5 rounded-xl" />
                                <div className="h-10 bg-white/5 rounded-xl" />
                                <div className="h-10 bg-white/5 rounded-xl" />
                            </div>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1">Full Name</Label>
                                        {isEditing ? (
                                            <Input
                                                value={user?.full_name || ""}
                                                onChange={(e) => setUser(u => u ? { ...u, full_name: e.target.value } : null)}
                                                className="h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 rounded-xl px-4"
                                                placeholder="Your Name"
                                            />
                                        ) : (
                                            <div className="h-12 bg-white/[0.02] border border-white/5 flex items-center px-4 rounded-xl text-white font-bold">
                                                {user?.full_name || "NOT SET"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1">Username</Label>
                                        {isEditing ? (
                                            <Input
                                                value={user?.username || ""}
                                                onChange={(e) => setUser(u => u ? { ...u, username: e.target.value } : null)}
                                                className="h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 rounded-xl px-4"
                                                placeholder="username"
                                            />
                                        ) : (
                                            <div className="h-12 bg-white/[0.02] border border-white/5 flex items-center px-4 rounded-xl text-gray-400 font-mono">
                                                @{user?.username || "identity_unknown"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold ml-1">Email Address</Label>
                                            <span className="text-[9px] font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">SECURED</span>
                                        </div>
                                        <div className="h-12 bg-white/[0.01] border border-white/5 flex items-center px-4 rounded-xl text-gray-400 font-mono text-xs">
                                            {user?.email}
                                        </div>
                                    </div>

                                {isEditing && (
                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button
                                            onClick={() => setIsEditing(false)}
                                            variant="ghost"
                                            className="h-10 text-gray-500 font-bold px-6 rounded-xl hover:bg-white/5"
                                        >
                                            CANCEL
                                        </Button>
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                            className="h-10 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary font-bold px-6 rounded-xl transition-all flex items-center gap-2"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            SYNCHRONIZE
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/5">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2 text-secondary">
                            <Zap className="w-5 h-5" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Neural Engine</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold text-sm">Hardware Acceleration</Label>
                                <p className="text-xs text-gray-500 font-mono uppercase">Use GPU for faster inference (WebGPU)</p>
                            </div>
                            <Switch checked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold text-sm">Quantized Weights</Label>
                                <p className="text-xs text-gray-500 font-mono uppercase">Reduce memory usage with INT8 precision</p>
                            </div>
                            <Switch checked />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/5">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2 text-accent">
                            <Database className="w-5 h-5" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Data & Storage</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold text-sm">Auto-Archive</Label>
                                <p className="text-xs text-gray-500 font-mono uppercase">Automatically save scans to cloud history</p>
                            </div>
                            <Switch checked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold text-sm">Public Storage</Label>
                                <p className="text-xs text-gray-500 font-mono uppercase">Allow sharing links to detection results</p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
