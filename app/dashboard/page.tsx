"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CopyPlus, Activity, Target, Video, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid } from 'recharts';
import { createClient } from "@/lib/supabase/client";
import { TiltWrapper } from "@/components/ui/tilt-wrapper";

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalScans: 0,
        objectsDetected: 0,
        avgAccuracy: 0,
        scansTrend: "+0%",
        objectsTrend: "+0%",
        accuracyTrend: "+0%"
    });
    const [chartData, setChartData] = useState<{ time: string; detections: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    useEffect(() => {
        const supabase = createClient();
        async function fetchDashboardData() {
            setLoading(true);
            const { data, error } = await supabase
                .from('detections')
                .select('*')
                .order('created_at', { ascending: true });

            if (!error && data) {
                const totalScans = data.length;
                const objectsDetected = data.reduce((acc, curr) => acc + (curr.objects_detected?.length || 0), 0);
                const avgAccuracy = data.length > 0
                    ? (data.reduce((acc, curr) => acc + curr.accuracy, 0) / data.length) * 100
                    : 0;

                setStats(prev => ({
                    ...prev,
                    totalScans,
                    objectsDetected,
                    avgAccuracy
                }));

                const timeline = data.map(item => ({
                    time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    detections: item.objects_detected?.length || 0
                })).slice(-10);
                setChartData(timeline);
            }
            setLoading(false);
        }

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 relative">
            {/* Removed background glow divs */}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary uppercase">
                        COMMAND CENTER
                    </h1>
                    <p className="text-gray-500 text-sm font-mono mt-1 uppercase tracking-widest leading-none">Neural Stream Matrix v8.0.4</p>
                </div>
                <div className="flex gap-4 items-center">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleSignOut}
                        className="text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-full h-8 px-4 text-xs font-mono tracking-widest uppercase transition-all"
                    >
                        Sign Out
                        <LogOut className="w-3 h-3 ml-2" />
                    </Button>
                </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
                {[
                    { title: "Total Scans", value: stats.totalScans.toLocaleString(), icon: CopyPlus, color: "text-primary", trend: stats.scansTrend },
                    { title: "Objects Detected", value: stats.objectsDetected.toLocaleString(), icon: Target, color: "text-secondary", trend: stats.objectsTrend },
                    { title: "Avg Accuracy", value: `${stats.avgAccuracy.toFixed(1)}%`, icon: Activity, color: "text-accent", trend: stats.accuracyTrend },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                    >
                        <TiltWrapper className="h-full">
                            <Card className="glass-card border-white/5 hover:border-primary/30 transition-all group overflow-hidden relative h-full">
                                {/* Removed card hover glow circle */}
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">{stat.title}</CardTitle>
                                    <stat.icon className={`h-4 w-4 ${stat.color} group-hover:scale-125 transition-transform`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black font-mono text-white tracking-widest leading-none mb-2">
                                        {loading ? '---' : stat.value}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">{stat.trend}</span>
                                        <span className="text-[10px] text-gray-600 font-mono uppercase tracking-tighter">vs last session</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </TiltWrapper>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-4"
                >
                    <Card className="glass-card border-white/5 h-full">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold tracking-tight uppercase">Detection Frequency</CardTitle>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-secondary/40 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                            </div>
                        </CardHeader>
                        <CardContent className="pl-0 h-[350px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#FF0080" />
                                                <stop offset="100%" stopColor="#7928CA" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="time" stroke="#ffffff30" axisLine={false} tickLine={false} fontSize={10} fontStyle="mono" />
                                        <YAxis stroke="#ffffff30" axisLine={false} tickLine={false} fontSize={10} fontStyle="mono" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="detections"
                                            stroke="url(#lineGradient)"
                                            strokeWidth={4}
                                            dot={{ r: 4, fill: "#FF0080", strokeWidth: 2, stroke: "#000" }}
                                            activeDot={{ r: 8, fill: "#7928CA", strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-700 font-mono text-xs uppercase tracking-widest italic">
                                    No activity detected
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-3 h-full"
                >
                    <TiltWrapper className="h-full">
                        <Card className="glass-card border-white/5 overflow-hidden relative h-full group">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center text-lg font-bold tracking-tight uppercase">
                                    <span>Real-time Flux</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/50 animate-pulse">ENCRYPTED</span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/50">4K@60FPS</span>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="h-[350px] w-full bg-black/80 relative flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
                                    <motion.div
                                        className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-transparent via-primary/20 to-transparent z-10 opacity-50"
                                        animate={{ top: ["-40%", "100%", "-40%"] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full animate-pulse"></div>
                                            <Video className="w-12 h-12 text-white/40 relative z-10" />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="text-[10px] font-mono text-primary animate-pulse tracking-widest uppercase font-bold text-center">Neural Stream Wait...</div>
                                            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-tighter italic">SIG_STRENGTH: 98.4%</div>
                                        </div>
                                        <div className="mt-8 grid grid-cols-2 gap-3 opacity-60 w-3/4">
                                            {[1, 2, 3, 4].map(idx => (
                                                <div key={idx} className="border border-white/5 p-2 rounded-lg text-xs bg-white/5 flex items-center gap-2 group-hover:border-primary/20 transition-all cursor-pointer">
                                                    <div className="w-1 h-1 rounded-full bg-secondary"></div>
                                                    <span className="text-[9px] font-mono text-gray-400 leading-none">NODE_0{idx}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/30"></div>
                                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/30"></div>
                                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/30"></div>
                                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/30"></div>
                                </div>
                            </CardContent>
                        </Card>
                    </TiltWrapper>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-8 pt-4 border-t border-white/5 text-[9px] font-mono text-gray-600 tracking-widest uppercase"
            >
                <div className="flex items-center gap-2 underline decoration-secondary/30 decoration-offset-4">
                    <span className="text-secondary font-black">01</span>
                    ENC_PROTOCOL: AE024
                </div>
                <div className="flex items-center gap-2 underline decoration-primary/30 decoration-offset-4">
                    <span className="text-primary font-black">02</span>
                    REGION: AP-SOUTH-1
                </div>
                <div className="flex items-center gap-2 underline decoration-accent/30 decoration-offset-4">
                    <span className="text-accent font-black">03</span>
                    UPTIME: 99.999%
                </div>
            </motion.div>
        </div>
    );
}
