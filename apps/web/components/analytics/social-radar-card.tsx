"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  ExternalLink,
  Sparkles,
  Lock,
  ArrowRight,
  Heart,
  Repeat2,
  MessageSquare,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  analyticsApi,
  SocialMentionItem,
  SocialRadarData,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

interface SocialRadarCardProps {
  websiteId: string;
  domain?: string;
  timeRange?: string;
  hasSocialRadar?: boolean;
}

// X (Twitter) Logo SVG
function XIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Reddit Logo SVG
function RedditIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#FF4500">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.56 1.25 1.248a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.492 1.207-.492.946 0 1.712.766 1.712 1.712 0 .6-.312 1.127-.775 1.424a5.614 5.614 0 0 1 .056.786c0 3.32-3.834 6.012-8.56 6.012-4.726 0-8.56-2.692-8.56-6.012 0-.27.021-.537.06-.796a1.69 1.69 0 0 1-.767-1.412c0-.946.766-1.712 1.712-1.712.483 0 .91.19 1.22.505 1.19-.85 2.836-1.41 4.65-1.486l.898-4.21 3.238.683c.094-.48.514-.85 1.025-.85zM9.54 11.758a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm4.92 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-4.99 4.305a.43.43 0 0 0-.306.732c.98.98 2.56.98 3.54 0a.43.43 0 1 0-.61-.61c-.64.64-1.68.64-2.32 0a.43.43 0 0 0-.304-.122z" />
    </svg>
  );
}

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SocialRadarSkeleton() {
  return (
    <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 sm:p-6 shadow-sm animate-pulse select-none">
      {/* Skeleton Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/[0.05]" />
          <div className="space-y-1.5">
            <div className="w-36 h-4 rounded bg-white/[0.06]" />
            <div className="w-64 h-3 rounded bg-white/[0.03]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-7 rounded-lg bg-white/[0.04]" />
          <div className="w-16 h-7 rounded-lg bg-white/[0.04]" />
        </div>
      </div>

      {/* Skeleton Chart (Zero Box Background, Matches Main Chart) */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="w-48 h-3 rounded bg-white/[0.04]" />
          <div className="w-40 h-3 rounded bg-white/[0.04]" />
        </div>
        <div className="w-full h-44 flex items-end justify-between px-4 py-3 gap-2">
          {[20, 45, 15, 60, 35, 75, 40, 65, 80, 50, 85, 70, 90, 60, 45].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-white/[0.03] rounded-t-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Skeleton Post Chips */}
      <div className="flex items-center gap-3">
        <div className="w-20 h-3 rounded bg-white/[0.04]" />
        <div className="w-36 h-9 rounded-xl bg-white/[0.04]" />
        <div className="w-40 h-9 rounded-xl bg-white/[0.04]" />
        <div className="w-32 h-9 rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

export function SocialRadarCard({
  websiteId,
  domain,
  timeRange = "30 Days",
  hasSocialRadar = true,
}: SocialRadarCardProps) {
  const [data, setData] = useState<SocialRadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPost, setHoveredPost] = useState<SocialMentionItem | null>(null);
  const [flyoutPlatform, setFlyoutPlatform] = useState<"x" | "reddit" | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    analyticsApi
      .getSocialRadar(websiteId, timeRange)
      .then((res) => {
        if (mounted && res && res.success) {
          setData(res);
        }
      })
      .catch((err) => {
        console.error("Failed to load social radar:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [websiteId, timeRange]);

  if (loading) {
    return <SocialRadarSkeleton />;
  }

  const mentions = data?.mentions || [];
  const timeseries = data?.timeseries || [];
  const stats = data?.stats || {
    totalMentions: 0,
    xCount: 0,
    redditCount: 0,
    totalEngagements: 0,
    topPost: null,
  };

  const isLowDensity = mentions.length >= 1 && mentions.length <= 4;
  const isHighDensity = mentions.length >= 5;
  const isLocked = !hasSocialRadar || data?.planRestricted;

  // Format timeseries for display
  const chartData = timeseries.map((pt) => ({
    label: pt.label || pt.date,
    date: pt.date,
    x: pt.x,
    reddit: pt.reddit,
    total: pt.total,
  }));

  // Custom Radar Tooltip (Matches Main Analytics Chart Tooltip 1:1)
  const CustomRadarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const xVal = payload.find((p: any) => p.dataKey === "x")?.value || 0;
      const redditVal = payload.find((p: any) => p.dataKey === "reddit")?.value || 0;
      const total = xVal + redditVal;

      return (
        <div className="bg-[#1F1F1F] border border-white/[0.08] p-3 rounded-lg shadow-xl shadow-black/50 pointer-events-none z-50 relative min-w-[170px]">
          <div className="text-zinc-400 text-xs font-mono mb-2 pb-1 border-b border-white/[0.06]">
            {label}
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-[#E11D48]" /> Total Mentions:
              </span>
              <span className="text-white font-bold">{total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sky-400 pt-0.5">
              <span className="flex items-center gap-1">𝕏 Twitter:</span>
              <span className="font-bold text-white">{xVal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-orange-400">
              <span className="flex items-center gap-1">Reddit:</span>
              <span className="font-bold text-white">{redditVal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative rounded-2xl bg-[#262626] border border-white/[0.08] p-5 sm:p-6 overflow-hidden shadow-sm">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-[#800E13]/20 border border-[#800E13]/30 text-rose-400">
            <Radio className="h-4 w-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#800E13]" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white">
              Social Mention Radar
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tracking domain mentions, viral threads, and community discussions
            </p>
          </div>
        </div>

        {/* Stats Chips */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/[0.06] text-xs font-mono text-zinc-300">
            <XIcon className="w-3 h-3 text-zinc-900 dark:text-white" />
            <span>{stats.xCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/[0.06] text-xs font-mono text-zinc-300">
            <RedditIcon className="w-3 h-3" />
            <span>{stats.redditCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Timeline Chart (Matches Main Analytics Chart 1:1) */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between px-1 text-xs font-mono mb-2">
          <div className="flex items-center gap-4 text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
              <span className="text-zinc-300 font-medium">𝕏 (Twitter):</span>
              <span className="text-white font-bold">{stats.xCount}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500]" />
              <span className="text-zinc-300 font-medium">Reddit:</span>
              <span className="text-white font-bold">{stats.redditCount}</span>
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Hover graph points to inspect daily distribution
          </span>
        </div>

        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorX" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorReddit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4500" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FF4500" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
                minTickGap={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomRadarTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1, strokeDasharray: "4 4" }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="reddit"
                stroke="#FF4500"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReddit)"
                animationDuration={800}
                activeDot={{ r: 4, fill: "#FF4500", stroke: "#1F1F1F", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="x"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorX)"
                animationDuration={800}
                activeDot={{ r: 4, fill: "#38bdf8", stroke: "#1F1F1F", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Adaptive Mention Display */}
      {loading ? (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
          <div className="w-48 h-4 rounded bg-white/[0.06]" />
        </div>
      ) : mentions.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-white/[0.08] rounded-xl">
          <Sparkles className="w-5 h-5 text-zinc-500 mx-auto mb-1.5" />
          <p className="text-xs text-zinc-400">
            No social mentions discovered yet for {domain || "your domain"} in this time range.
          </p>
        </div>
      ) : (
        <div>
          {/* Case A: Low Volume (1 to 4 Posts) — Profile Cards with Hover Previews */}
          {isLowDensity && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono text-zinc-400 mr-1">Discovered:</span>
              {mentions.map((post) => (
                <div
                  key={post.id}
                  onMouseEnter={() => setHoveredPost(post)}
                  onMouseLeave={() => setHoveredPost(null)}
                  className="relative"
                >
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] hover:border-white/[0.2] transition-all cursor-pointer group"
                  >
                    {/* Avatar */}
                    {post.authorAvatarUrl ? (
                      <img
                        src={post.authorAvatarUrl}
                        alt={post.authorName}
                        className="w-5 h-5 rounded-full object-cover bg-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {post.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {post.authorHandle}
                    </span>

                    {post.platform === "x" ? (
                      <XIcon className="w-3 h-3 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white ml-0.5" />
                    ) : (
                      <RedditIcon className="w-3 h-3 ml-0.5" />
                    )}

                    <span className="text-[10px] font-mono text-zinc-500">
                      {timeAgo(post.postedAt)}
                    </span>
                  </a>

                  {/* Hover Floating Post Preview Card */}
                  {hoveredPost?.id === post.id && (
                    <div className="absolute bottom-full left-0 mb-2 w-80 p-3.5 rounded-xl bg-[#18181b] border border-white/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {post.authorAvatarUrl && (
                            <img
                              src={post.authorAvatarUrl}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="text-xs font-bold text-white leading-tight">
                              {post.authorName}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              {post.authorHandle}
                            </div>
                          </div>
                        </div>
                        {post.platform === "x" ? (
                          <div className="p-1 rounded bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 text-zinc-900 dark:text-white">
                            <XIcon className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="p-1 rounded bg-orange-950/40 border border-orange-500/20">
                            <RedditIcon className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed mb-3 whitespace-pre-wrap line-clamp-4">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/[0.08]">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-rose-400">
                            <Heart className="w-3 h-3" /> {post.likes}
                          </span>
                          {post.platform === "x" && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Repeat2 className="w-3 h-3" /> {post.reposts}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-sky-400">
                            <MessageSquare className="w-3 h-3" /> {post.replies}
                          </span>
                        </div>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-300 hover:text-white flex items-center gap-1 hover:underline"
                        >
                          Open <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Case B: High Volume (5+ Posts) — Grouped Platform Pills with Hover Flyout */}
          {isHighDensity && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono text-zinc-400 mr-1">Aggregated Platforms:</span>

              {/* X Platform Pill */}
              {stats.xCount > 0 && (
                <div
                  onMouseEnter={() => setFlyoutPlatform("x")}
                  onMouseLeave={() => setFlyoutPlatform(null)}
                  className="relative"
                >
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] hover:border-sky-500/30 text-xs font-mono text-zinc-200 hover:text-white transition-all cursor-pointer">
                    <XIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>{stats.xCount} X (Twitter) Posts</span>
                    <span className="text-[10px] text-zinc-500">&bull; Hover for list</span>
                  </button>

                  {/* X Flyout List */}
                  {flyoutPlatform === "x" && (
                    <div className="absolute bottom-full left-0 mb-2 w-96 max-h-72 overflow-y-auto p-2 rounded-xl bg-[#18181b] border border-white/15 shadow-2xl z-50">
                      <div className="text-[11px] font-mono text-zinc-400 px-2 py-1 mb-1 border-b border-white/[0.06]">
                        Recent X Mentions ({stats.xCount})
                      </div>
                      <div className="space-y-1">
                        {mentions
                          .filter((m) => m.platform === "x")
                          .map((m) => (
                            <a
                              key={m.id}
                              href={m.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-bold text-zinc-900 dark:text-white">{m.authorHandle}</span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {timeAgo(m.postedAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-2">{m.content}</p>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reddit Platform Pill */}
              {stats.redditCount > 0 && (
                <div
                  onMouseEnter={() => setFlyoutPlatform("reddit")}
                  onMouseLeave={() => setFlyoutPlatform(null)}
                  className="relative"
                >
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] hover:border-orange-500/30 text-xs font-mono text-zinc-200 hover:text-white transition-all cursor-pointer">
                    <RedditIcon className="w-3.5 h-3.5 text-orange-400" />
                    <span>{stats.redditCount} Reddit Threads</span>
                    <span className="text-[10px] text-zinc-500">&bull; Hover for list</span>
                  </button>

                  {/* Reddit Flyout List */}
                  {flyoutPlatform === "reddit" && (
                    <div className="absolute bottom-full left-0 mb-2 w-96 max-h-72 overflow-y-auto p-2 rounded-xl bg-[#18181b] border border-white/15 shadow-2xl z-50">
                      <div className="text-[11px] font-mono text-zinc-400 px-2 py-1 mb-1 border-b border-white/[0.06]">
                        Recent Reddit Threads ({stats.redditCount})
                      </div>
                      <div className="space-y-1">
                        {mentions
                          .filter((m) => m.platform === "reddit")
                          .map((m) => (
                            <a
                              key={m.id}
                              href={m.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                            >
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-bold text-orange-600 dark:text-orange-400">{m.authorHandle}</span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {timeAgo(m.postedAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-2">{m.content}</p>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Plan Gated Lock Overlay (For Solo Plan Users) */}
      {isLocked && (
        <div className="absolute inset-0 bg-[#262626]/85 social-radar-locked-overlay backdrop-blur-[6px] z-40 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#800E13]/20 border border-[#800E13]/40 flex items-center justify-center text-rose-400 mb-3 shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white tracking-tight">
            X (Twitter) & Reddit Social Radar
          </h4>
          <p className="text-xs text-zinc-400 max-w-md mt-1 mb-4 leading-relaxed">
            Live domain mention monitoring, viral post tracking, and community social attribution are exclusive to the <strong>Growth Plan</strong>.
          </p>
          <Button
            asChild
            size="sm"
            className="bg-[#800E13] hover:bg-[#9B111E] text-white font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer shadow-md"
          >
            <Link href="/dashboard/settings?tab=billing">
              Upgrade to Growth Plan
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
