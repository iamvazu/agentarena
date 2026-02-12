import React from 'react';
import { TrendingUp, TrendingDown, Cpu } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Position {
    symbol: string;
    qty: number;
    entry: number;
    pnl_pct: number;
}

interface AgentProps {
    agent: {
        id: number;
        name: string;
        status: string;
        pnl_spx: number;
        balance_spx: number;
        positions: Position[];
        generation: number;
    };
}

const avatars = ["🫖", "🌸", "🐸", "🐹", "🦊", "🐻", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐙", "🦋", "🦄", "🐼"];

export const AgentCard: React.FC<AgentProps> = ({ agent }) => {
    const isPositive = agent.pnl_spx >= 0;
    const avatar = avatars[agent.id % avatars.length];

    return (
        <div className="glass group relative overflow-hidden rounded-xl bg-[#1a1b23]/80 p-4 border border-white/5 transition-all hover:border-white/20">
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2b36] text-xl shadow-inner">
                        {avatar}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white/90">{agent.name.split('_')[0]}</h3>
                            <span className={cn(
                                "h-2 w-2 rounded-full shadow-[0_0_8px]",
                                agent.status === 'active' ? "bg-emerald-400 shadow-emerald-400/50" : "bg-zinc-600"
                            )} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                            <span>Latency: {180 + (agent.id % 50)}ms</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn(
                        "text-xs font-black",
                        isPositive ? "text-emerald-400" : "text-rose-400"
                    )}>
                        {isPositive ? '+' : ''}{agent.pnl_spx.toFixed(3)} SPX
                    </p>
                    <p className="text-[10px] text-zinc-500 font-bold">
                        Bal: {agent.balance_spx.toLocaleString()} SPX
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-hidden rounded-lg bg-black/20">
                <table className="w-full text-left text-[10px]">
                    <thead>
                        <tr className="border-b border-white/5 text-zinc-500 uppercase font-bold tracking-tight">
                            <th className="px-2 py-1.5">Contract</th>
                            <th className="px-2 py-1.5 text-right">Size</th>
                            <th className="px-2 py-1.5 text-right">Entry</th>
                            <th className="px-2 py-1.5 text-right">PnL</th>
                        </tr>
                    </thead>
                    <tbody className="font-mono">
                        {agent.positions.length > 0 ? (
                            agent.positions.map((pos, i) => (
                                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="px-2 py-1.5 font-bold text-zinc-300">{pos.symbol}</td>
                                    <td className="px-2 py-1.5 text-right text-zinc-400">{pos.qty}</td>
                                    <td className="px-2 py-1.5 text-right text-zinc-400">{pos.entry}</td>
                                    <td className={cn(
                                        "px-2 py-1.5 text-right font-bold",
                                        pos.pnl_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        {pos.pnl_pct >= 0 ? '▲' : '▼'}{Math.abs(pos.pnl_pct)}%
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-2 py-4 text-center text-zinc-600 italic">No active contracts</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
