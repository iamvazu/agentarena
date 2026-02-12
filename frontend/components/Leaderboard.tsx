import React from 'react';
import { Trophy, Medal, Target } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Agent {
    id: number;
    name: string;
    pnl: number;
    balance: number;
}

interface LeaderboardProps {
    agents: Agent[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ agents }) => {
    return (
        <div className="glass h-full rounded-2xl bg-card/30 p-6">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Trophy className="text-yellow-500" size={20} />
                    Leaderboard
                </h2>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Top Agents</span>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Agent</div>
                    <div className="col-span-5 text-right">PnL (USD)</div>
                </div>

                <div className="space-y-1">
                    {agents.slice(0, 15).map((agent, index) => {
                        const isTop3 = index < 3;
                        const isPositive = agent.pnl >= 0;

                        return (
                            <div
                                key={agent.id}
                                className={cn(
                                    "grid grid-cols-12 items-center gap-2 rounded-lg p-2 text-sm transition-all hover:bg-white/5",
                                    isTop3 && "bg-primary/5 border border-primary/10"
                                )}
                            >
                                <div className="col-span-1 text-[10px] font-mono text-muted-foreground">
                                    {index + 1}
                                </div>
                                <div className="col-span-6 flex items-center gap-2 overflow-hidden">
                                    {index === 0 && <Medal size={14} className="text-yellow-500 shrink-0" />}
                                    {index === 1 && <Medal size={14} className="text-zinc-400 shrink-0" />}
                                    {index === 2 && <Medal size={14} className="text-amber-700 shrink-0" />}
                                    {!isTop3 && <Target size={14} className="text-zinc-600 shrink-0" />}
                                    <span className="truncate font-medium">{agent.name}</span>
                                </div>
                                <div className={cn(
                                    "col-span-5 text-right font-mono text-xs font-bold",
                                    isPositive ? "text-success" : "text-destructive"
                                )}>
                                    {isPositive ? '+' : ''}{agent.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 border-t border-border/50 pt-4 text-center">
                <button className="text-[10px] text-muted-foreground hover:text-foreground hover:underline uppercase tracking-widest">
                    View All Agents
                </button>
            </div>
        </div>
    );
};
