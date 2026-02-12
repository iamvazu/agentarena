import React from 'react';
import { TrendingUp, TrendingDown, Activity, Cpu } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Position {
    symbol: string;
    qty: number;
    avg_price: number;
}

interface AgentProps {
    agent: {
        id: number;
        name: string;
        status: string;
        pnl: number;
        balance: number;
        positions: Position[];
        generation: number;
    };
}

export const AgentCard: React.FC<AgentProps> = ({ agent }) => {
    const isPositive = agent.pnl >= 0;

    return (
        <div className="glass group relative overflow-hidden rounded-xl bg-card/50 p-4 transition-all hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5">
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-primary/20 group-hover:text-primary">
                        <Cpu size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "h-2 w-2 rounded-full animate-pulse",
                                agent.status === 'active' ? "bg-success" : "bg-destructive"
                            )} />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                Gen {agent.generation} • {agent.status}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn(
                        "text-sm font-bold",
                        isPositive ? "text-success" : "text-destructive"
                    )}>
                        {isPositive ? '+' : ''}{agent.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        Bal: {agent.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-border/50 pb-1 text-[10px] font-medium text-muted-foreground uppercase">
                    <span>Contract</span>
                    <div className="flex gap-4">
                        <span className="w-8 text-right">Size</span>
                        <span className="w-12 text-right">PnL</span>
                    </div>
                </div>

                {agent.positions.length > 0 ? (
                    agent.positions.map((pos) => (
                        <div key={pos.symbol} className="flex items-center justify-between text-xs transition-colors hover:text-foreground">
                            <span className="font-mono font-medium">{pos.symbol}</span>
                            <div className="flex gap-4 font-mono">
                                <span className="w-8 text-right text-muted-foreground">{pos.qty}</span>
                                <span className="w-12 text-right text-success">+0.1%</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-2 text-center text-[10px] text-muted-foreground italic">
                        No active trades
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Activity size={10} />
                    Latency: {Math.floor(Math.random() * 100) + 150}ms
                </span>
                <button className="rounded px-2 py-0.5 transition-colors hover:bg-zinc-800 hover:text-primary">
                    Details
                </button>
            </div>
        </div>
    );
};
