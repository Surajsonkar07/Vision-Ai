"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Zap, Clock, Activity, Cpu } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { Player } from "@remotion/player";
import { NetworkScene } from "@/components/remotion/NetworkScene";

export default function AnalyticsPage() {
    const [stats, setStats] = useState<{ total: number; avgAccuracy: number; avgLatency: string } | null>(null);
    const [history, setHistory] = useState<{ created_at: string; accuracy: number; latency: number }[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const supabase = createClient();
        async function fetchAnalytics() {
            setLoading(true);
            const { data, error } = await supabase
                .from('detections')
                .select('*')
                .order('created_at', { ascending: true });

            if (!error && data) {
                setHistory(data);

                // Process basic stats
                const total = data.length;
                const avgAccuracy = data.reduce((acc, curr) => acc + curr.accuracy, 0) / (total || 1);
                const avgLatency = data.reduce((acc, curr) => acc + curr.latency, 0) / (total || 1);

                setStats({
                    total,
                    avgAccuracy: avgAccuracy * 100,
                    avgLatency: avgLatency.toFixed(1)
                });
            }
            setLoading(false);
        }

        fetchAnalytics();
    }, []);

    // Mock trend fallback if no data
    const chartData = history.length > 0 ? history.map(item => ({
        time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        accuracy: (item.accuracy * 100),
        latency: item.latency
    })) : [
        { time: '10:00', accuracy: 0, latency: 0 },
        { time: '12:00', accuracy: 0, latency: 0 },
        { time: '14:00', accuracy: 0, latency: 0 },
    ];

    const COLORS = ['#FF0080', '#7928CA', '#00DFD8'];

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-secondary via-accent to-primary uppercase">
                        NEURAL ANALYTICS
                    </h1>
                    <p className="text-gray-500 text-sm font-mono mt-1 uppercase tracking-widest">Real-time performance metrics & insights</p>
                </div>
            </motion.div>

            {/* Remotion Visualization */}
            <Card className="glass-card border-white/5 overflow-hidden p-0 relative h-[300px]">
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-none">
                    <Player
                        component={NetworkScene}
                        durationInFrames={300}
                        compositionWidth={1000}
                        compositionHeight={300}
                        fps={30}
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                        autoPlay
                        loop
                        controls={false}
                    />
                </div>
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_#00ffff]"></div>
                    <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase text-shadow-glow">Global Mesh Topology</span>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card border-white/5 p-6 space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Activity className="w-12 h-12 text-primary" />
                    </div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">Total Inferences</p>
                    <h3 className="text-3xl font-black text-white">{loading ? '---' : stats?.total || 0}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>LIVE SYNC</span>
                    </div>
                </Card>

                <Card className="glass-card border-white/5 p-6 space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap className="w-12 h-12 text-secondary" />
                    </div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">Avg Neural Accuracy</p>
                    <h3 className="text-3xl font-black text-white">{loading ? '---' : `${(stats?.avgAccuracy || 0).toFixed(1)}%`}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-secondary">
                        <Activity className="w-3 h-3" />
                        <span>OPTIMAL</span>
                    </div>
                </Card>

                <Card className="glass-card border-white/5 p-6 space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock className="w-12 h-12 text-accent" />
                    </div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">Inference Latency</p>
                    <h3 className="text-3xl font-black text-white">{loading ? '---' : `${stats?.avgLatency || 0}ms`}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-accent">
                        <Cpu className="w-3 h-3" />
                        <span>QUANTIZED</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Accuracy Trend */}
                <Card className="glass-card border-white/5 p-6 h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-sm tracking-widest uppercase">Accuracy Flux</h3>
                        </div>
                    </div>
                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF0080" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FF0080" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="time" hide />
                                <YAxis hide domain={[80, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#FF0080', fontSize: '10px', fontFamily: 'monospace' }}
                                />
                                <Area type="monotone" dataKey="accuracy" stroke="#FF0080" fillOpacity={1} fill="url(#colorAcc)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Latency Distribution */}
                <Card className="glass-card border-white/5 p-6 h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-secondary" />
                            <h3 className="font-bold text-sm tracking-widest uppercase">Temporal Latency</h3>
                        </div>
                    </div>
                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="time" hide />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#00DFD8', fontSize: '10px', fontFamily: 'monospace' }}
                                />
                                <Bar dataKey="latency" radius={[4, 4, 0, 0]}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
