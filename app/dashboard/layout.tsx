"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    UploadCloud,
    Video,
    History,
    BarChart,
    Settings,
    LogOut,
    ScanLine,
    Menu,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { TiltWrapper } from "@/components/ui/tilt-wrapper";

const routes = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Live Scan", path: "/dashboard/webcam", icon: Video },
    { name: "Upload", path: "/dashboard/upload", icon: UploadCloud },
    { name: "History", path: "/dashboard/history", icon: History },
    { name: "Analytics", path: "/dashboard/analytics", icon: BarChart },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const SidebarContent = () => (
        <>
            <div className="px-6 mb-10 flex items-center gap-2">
                <ScanLine className="text-primary w-6 h-6" />
                <span className="font-mono font-bold tracking-tighter text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    VISION.AI
                </span>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {routes.map((route) => {
                    const isActive = pathname === route.path;
                    const Icon = route.icon;

                    return (
                        <Link key={route.path} href={route.path} className="block">
                            <TiltWrapper maxTilt={5} scale={1.03}>
                                <div
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${isActive
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium text-sm">{route.name}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-nav"
                                            className="absolute left-0 w-1 h-8 bg-primary rounded-r-md"
                                        />
                                    )}
                                </div>
                            </TiltWrapper>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-background text-foreground flex-col lg:flex-row relative">

            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between p-4 glass border-b border-white/5 z-30">
                <div className="flex items-center gap-2">
                    <ScanLine className="text-primary w-5 h-5" />
                    <span className="font-mono font-bold tracking-tighter text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        VISION.AI
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 glass rounded-lg border-white/10"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    >
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-72 h-full glass border-r border-white/5 flex flex-col pt-6"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 flex-col pt-6 z-20">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:pl-64 relative overflow-x-hidden">
                <div className="p-4 lg:p-8 relative z-10 min-h-full">
                    {children}
                </div>
            </main>

        </div>
    );
}
