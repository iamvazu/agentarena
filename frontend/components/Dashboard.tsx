"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Leaderboard } from './Leaderboard';
import { AgentCard } from './AgentCard';
import { RefreshCcw, Activity, ArrowUpRight } from 'lucide-react';

const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') {
        // If we're on Heroku/Production, default to the current domain
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
            return `https://${hostname}`;
        }
    }
    return 'http://localhost:8000';
};

const API_BASE_URL = getApiUrl();

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
            setData(response.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const triggerCycle = async () => {
        try {
            await axios.post(`${API_BASE_URL}/simulate/cycle`);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0b10] text-[#3b82f6]">
                <Activity className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0e14] text-zinc-100 font-sans selection:bg-primary/20 p-4 md:p-8">
            {/* Top Bar */}
            <div className="mx-auto max-w-[1700px]">
                <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight text-white/90">Agent Overview</h1>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5 mt-0.5">
                            $SPX: <span className="text-white">${data?.spx_price.toLocaleString()}</span>
                            <span className="text-emerald-400 font-black">▲ 0.8%</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Global Stats Cards */}
                        <div className="flex items-center gap-2">
                            <div className="glass rounded-xl bg-[#1a1b23]/60 px-5 py-3 border border-white/5 min-w-[160px]">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">PnL (SPX)</span>
                                <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-lg font-black text-emerald-400">{data?.total_pnl_spx.toFixed(3)} SPX</span>
                                    <ArrowUpRight size={14} className="text-emerald-400 opacity-50" />
                                </div>
                            </div>
                            <div className="glass rounded-xl bg-[#1a1b23]/60 px-5 py-3 border border-white/5 min-w-[160px]">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">PnL (USD)</span>
                                <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-lg font-black text-emerald-400">${data?.total_pnl_usd.toLocaleString()}</span>
                                    <ArrowUpRight size={14} className="text-emerald-400 opacity-50" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={triggerCycle}
                            className="flex h-12 items-center gap-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] px-6 font-bold text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95"
                        >
                            <RefreshCcw size={16} />
                            <span className="uppercase text-xs tracking-widest">Run Cycle</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 xl:grid-cols-6">
                    {/* Sidebar - Leaderboard */}
                    <aside className="lg:col-span-1 xl:col-span-1">
                        <Leaderboard agents={data?.agents.slice(0, 20) || []} />
                    </aside>

                    {/* Main Grid - Agent Cards */}
                    <main className="lg:col-span-4 xl:col-span-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {data?.agents.map((agent: any) => (
                                <AgentCard key={agent.id} agent={agent} />
                            ))}
                        </div>
                        {data?.agents.length === 0 && (
                            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/5 text-zinc-600">
                                <p className="text-sm font-bold uppercase tracking-widest">No Agents Active in Arena</p>
                                <p className="text-[10px] mt-2">Run the seed script or create agents via API</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
