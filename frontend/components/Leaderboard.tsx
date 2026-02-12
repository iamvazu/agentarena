import React from 'react';
import { Trophy } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Agent {
    id: number;
    name: string;
    pnl_spx: number;
    balance_spx: number;
}

interface LeaderboardProps {
    agents: Agent[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ agents }) => {
    return (
        <div className="glass h-full rounded-xl bg-[#111218]/60 p-5 border border-white/5">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-white/90">Leaderboard</h2>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">All Agents</span>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-tighter border-b border-white/5 pb-2">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Agent</div>
                    <div className="col-span-5 text-right">PnL (SPX)</div>
                </div>

                <div className="space-y-0.5">
                    {agents.map((agent, index) => {
                        const isPositive = agent.pnl_spx >= 0;

                        return (
                            <div
                                key={agent.id}
                                className="grid grid-cols-12 items-center gap-2 rounded-md py-2 px-1 text-xs transition-all hover:bg-white/5"
                            >
                                <div className="col-span-1 text-[10px] font-mono font-bold text-zinc-500">
                                    {index + 1}
                                </div>
                                <div className="col-span-6 font-bold text-zinc-300">
                                    {agent.name.split('_')[0]}
                                </div>
                                <div className={cn(
                                    "col-span-5 text-right font-mono font-black",
                                    isPositive ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {isPositive ? '+' : ''}{agent.pnl_spx.toFixed(3)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 text-center">
                <button className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                    View All Agents
                </button>
            </div>
        </div>
    );
};
