"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Spline from '@splinetool/react-spline';

const EyeCanvas = dynamic(() => import("@/components/eye-canvas").then((mod) => mod.EyeCanvas), {
  ssr: false,
});
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ScanLine, Cpu, Target, Zap, Activity } from "lucide-react";
import { TiltWrapper } from "@/components/ui/tilt-wrapper";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#040406] selection:bg-primary/30 text-white font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-30 mix-blend-screen">
        <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20 animate-slow-fade"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 py-4 px-8 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold flex items-center gap-2 group cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:neon-border transition-all">
            <ScanLine className="text-primary w-5 h-5" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary font-mono tracking-tighter text-xl">
            VISION.AI
          </span>
        </motion.div>

        <div className="hidden md:flex items-center gap-8 text-[10px] font-mono tracking-widest uppercase text-gray-400">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#tech" className="hover:text-secondary transition-colors">Architecture</a>
          <a href="#docs" className="hover:text-accent transition-colors">Docs</a>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
          <Link href="/dashboard">
            <Button className="grad-primary hover:opacity-90 text-white rounded-full px-6 shadow-[0_0_20px_rgba(255,0,128,0.4)] border-0 transition-all hover:scale-105 active:scale-95">
              Launch Console
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-[90vh] px-6 lg:px-24 pt-32 pb-20">
        {/* Left Content */}
        <div className="flex-1 text-left z-20 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-8 group cursor-pointer hover:bg-primary/5 transition-all">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_#00ffff]"></div>
              <span className="text-[10px] font-mono text-secondary tracking-[0.2em] uppercase font-bold">Neural Engine v8.0 Active</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-8 leading-[1] tracking-tighter">
              OBSERVE.<br />
              <span className="neon-text text-primary">DETECT.</span><br />
              <span className="neon-text-cyan text-secondary">ANALYZE.</span>
            </h1>

            <p className="text-gray-400 text-lg sm:text-xl font-light mb-12 max-w-lg leading-relaxed">
              Experience the pinnacle of <span className="text-white font-medium">real-time spatial intelligence</span>.
              Our neural-accelerated engine delivers sub-15ms inference directly in your cloud environment.
            </p>

            <div className="flex flex-wrap gap-6 mb-16">
              <Link href="/dashboard">
                <Button size="lg" className="h-16 px-10 rounded-2xl grad-cyber text-white font-bold text-lg shadow-[0_0_40px_rgba(0,183,255,0.3)] hover:scale-105 transition-all active:scale-95">
                  Initialize Scan
                  <ScanLine className="w-6 h-6 ml-3" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium backdrop-blur-md">
                Documentation
              </Button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
            className="grid grid-cols-3 gap-4 lg:gap-8 max-w-xl"
          >
            {[
              { label: "Accuracy", val: "99.8%" },
              { label: "Latency", val: "< 15ms" },
              { label: "Classes", val: "80+" }
            ].map((stat, i) => (
              <TiltWrapper key={i}>
                <div className="glass-card p-4 rounded-2xl border-white/5 relative overflow-hidden group h-full">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-2xl font-black text-white mb-1 tracking-tighter">{stat.val}</div>
                  <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold font-mono">{stat.label}</div>
                </div>
              </TiltWrapper>
            ))}
          </motion.div>
        </div>

        {/* Right 3D Eye */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 h-[40vh] lg:h-[70vh] w-full relative group mt-12 lg:mt-0"
        >
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-[120px] group-hover:bg-primary/20 transition-all duration-1000"></div>
          <div className="absolute inset-0 bg-secondary/10 rounded-full blur-[80px] translate-x-10 translate-y-10 group-hover:bg-secondary/20 transition-all duration-1000"></div>
          <EyeCanvas />

          {/* Glass Overlay Elements */}
          <div className="absolute top-1/4 right-10 glass p-4 rounded-xl border-white/10 animate-bounce" style={{ animationDuration: '4s' }}>
            <Cpu className="text-primary w-6 h-6" />
          </div>
          <div className="absolute bottom-1/4 left-10 glass p-4 rounded-xl border-white/10 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
            <Sparkles className="text-secondary w-6 h-6" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6 lg:px-24 bg-gradient-to-b from-transparent to-black/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase">Advanced Capabilities</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Temporal Analysis",
                desc: "Process multi-frame sequences to understand object velocity and trajectory with pixel-perfect precision.",
                icon: <Activity className="w-8 h-8 text-primary" />,
                color: "primary"
              },
              {
                title: "Neural Edge Tech",
                desc: "Distributed inference architecture allows for heavy computation directly at the source with zero lag.",
                icon: <Cpu className="w-8 h-8 text-secondary" />,
                color: "secondary"
              },
              {
                title: "Global Mesh",
                desc: "Sync detections across multiple sites and cameras into a single, unified spatial data stream.",
                icon: <Target className="w-8 h-8 text-accent" />,
                color: "accent"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="h-full"
              >
                <TiltWrapper className="h-full">
                  <div className="glass-card p-10 rounded-[2rem] border-white/5 hover:border-white/10 transition-all group h-full">
                    <div className={`p-4 rounded-2xl bg-${feature.color}/10 border border-${feature.color}/20 mb-8 inline-block group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 tracking-tight">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed font-light">{feature.desc}</p>
                  </div>
                </TiltWrapper>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="relative z-10 py-32 px-6 lg:px-24">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[1.1]">Built for the <br /><span className="text-secondary">Next Dimension</span></h2>
            <p className="text-gray-400 text-lg leading-relaxed font-light">
              Our stack combines the cutting-edge performance of YOLOv8 for detection and the blazing speed of FastAPI backend architectures.
            </p>
            <ul className="space-y-4 font-mono text-[10px] tracking-[0.2em] text-gray-500 uppercase">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#ff0080]"></div> YOLOv8 Optimized Kernels</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#00ffff]"></div> FastAPI High-Concurrency Layer</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_#7000ff]"></div> Supabase Real-time Storage</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]"></div> Next.js 14 Spatial UI</li>
            </ul>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <TiltWrapper>
              <div className="glass-card p-8 rounded-3xl border-white/5 aspect-square flex flex-col items-center justify-center text-center">
                <Zap className="w-12 h-12 text-primary mb-4" />
                <div className="text-3xl font-black mb-1">90+</div>
                <div className="text-[8px] font-mono uppercase tracking-[0.3em] text-gray-500">FPS STREAM</div>
              </div>
            </TiltWrapper>
            <div className="translate-y-8">
              <TiltWrapper>
                <div className="glass-card p-8 rounded-3xl border-white/5 aspect-square flex flex-col items-center justify-center text-center">
                  <Activity className="w-12 h-12 text-secondary mb-4" />
                  <div className="text-3xl font-black mb-1">99%</div>
                  <div className="text-[8px] font-mono uppercase tracking-[0.3em] text-gray-500">RELIABILITY</div>
                </div>
              </TiltWrapper>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <TiltWrapper maxTilt={5} className="rounded-[3rem]">
            <div className="w-full h-full glass-card p-16 rounded-[inherit] border-white/10 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 uppercase">Ready to Evolve?</h2>
              <p className="text-gray-400 text-xl mb-12 max-w-xl mx-auto font-light leading-relaxed">
                Join the elite teams leveraging spatial intelligence to redefine their operational reality.
              </p>
              <Link href="/dashboard" className="relative z-10 block">
                <Button size="lg" className="h-20 px-12 rounded-full grad-primary text-white font-bold text-xl shadow-[0_0_50px_rgba(255,0,128,0.4)] transition-all active:scale-95 hover:scale-100">
                  Launch Console Now
                  <Sparkles className="w-6 h-6 ml-3" />
                </Button>
              </Link>
            </div>
          </TiltWrapper>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 border-t border-white/5 px-6 lg:px-24 bg-black/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <ScanLine className="text-primary w-6 h-6" />
            <span className="text-xl font-black tracking-widest font-mono">VISION.AI</span>
          </div>
          <div className="flex gap-12 text-gray-500 text-[10px] font-mono tracking-widest uppercase">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <div className="text-gray-600 text-[10px] font-mono uppercase tracking-widest">
            © 2026 NEURAL ORIGIN CORP
          </div>
        </div>
      </footer>

      {/* HUD Info Labels */}
      <div className="fixed bottom-8 left-8 z-40 hidden md:block">
        <div className="flex flex-col gap-2 font-mono text-[10px] text-gray-500 tracking-tighter opacity-50">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            SYSTEM CORE: STABLE
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
            LATENCY: OPTIMAL
          </div>
        </div>
      </div>
    </main>
  );
}
