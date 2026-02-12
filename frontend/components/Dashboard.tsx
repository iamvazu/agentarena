"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Leaderboard } from './Leaderboard';
import { AgentCard } from './AgentCard';
import { LayoutDashboard, RefreshCcw, TrendingUp, Wallet, Activity } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
            alert("Simulated cycle triggered!");
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <Activity className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-secondary/5 blur-[120px]" />
            </div>

            <div className="relative mx-auto max-w-[1600px] px-6 py-8">
                {/* Header */}
                <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-primary">
                            <LayoutDashboard size={20} />
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">Agent Arena</span>
                        </div>
                        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                            Trading <span className="gradient-text">Simulation</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="glass flex items-center gap-4 rounded-xl bg-card/50 px-5 py-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Net PnL</span>
                                <span className={`text-xl font-black ${data?.total_pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    {data?.total_pnl >= 0 ? '+' : ''}{data?.total_pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </span>
                            </div>
                            <div className="h-10 w-[1px] bg-border" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Population</span>
                                <span className="text-xl font-black">{data?.agents.length} Agents</span>
                            </div>
                        </div>

                        <button
                            onClick={triggerCycle}
                            className="group flex h-14 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                        >
                            <RefreshCcw size={18} className="transition-transform group-hover:rotate-180" />
                            Run Cycle
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* Sidebar - Leaderboard */}
                    <aside className="lg:col-span-1">
                        <Leaderboard agents={data?.agents || []} />
                    </aside>

                    {/* Main Grid - Agent Cards */}
                    <main className="lg:col-span-3">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">
                                Agent Status Overview
                            </h2>
                            <span className="text-[10px] text-muted-foreground">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {data?.agents.map((agent: any) => (
                                <AgentCard key={agent.id} agent={agent} />
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
