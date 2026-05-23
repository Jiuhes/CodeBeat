import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import db from "../db";
import {
  RotateCcw,
  Search,
  TrendingUp,
  Target,
  Zap,
  ChevronRight,
  BookMarked,
  ArrowLeftRight,
  Flame,
  Clock,
  Sparkles,
  Calendar,
  Pencil,
  Trophy,
  
  CalendarDays,
} from "lucide-react";
import LANGUAGES from "../languages";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

export default function Dashboard({ cards, settings }) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);

  const [todayStats, setTodayStats] = useState({ practiced: 0, correct: 0, wrong: 0 });
  const [totalStats, setTotalStats] = useState({});
  const [achievements, setAchievements] = useState({});

  useEffect(() => {
    async function loadActivity() {
      try {
        const act = await db.getAllActivity();
        setActivities(act || []);
        setTodayStats(db.getTodayStats());
        setTotalStats(db.getStats());
        setAchievements(db.getAchievements());
      } catch (e) {
        console.error("加载学习动态失败:", e);
      }
    }
    loadActivity();
  }, [cards]);

  const stats = useMemo(() => {
    const total = cards.length;
    const mastered = cards.filter((c) => c.status === "mastered").length;
    const learning = cards.filter((c) => c.status === "learning" || c.status === "review").length;
    const newCount = cards.filter((c) => c.status === "new").length;
    
    const accuracy =
      total - newCount > 0
        ? Math.round((mastered / (total - newCount)) * 100)
        : 0;

    return { total, mastered, learning, newCount, accuracy };
  }, [cards]);

  const progressPercent =
    stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  // Smart time-based greeting
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 5) return { text: "深夜好", desc: "夜深了，请注意休息。建议保持良好的作息状态。" };
    if (hr < 9) return { text: "清晨好", desc: "新的一天开始了。建议学习或测试几组关键字，保持良好的学习状态。" };
    if (hr < 12) return { text: "上午好", desc: "今天也是专注精进的一天。建议继续查漏补缺，稳步积累关键字。" };
    if (hr < 14) return { text: "中午好", desc: "利用午间休息时间，可以进行一轮快速的自我测试或拼写练习。" };
    if (hr < 18) return { text: "下午好", desc: "继续保持节奏，合理规划时间进行记忆巩固，积跬步以至千里。" };
    return { text: "晚上好", desc: "今晚是巩固词汇的好时机。建议完成一轮练习，完美结束今天的学习。" };
  }, []);

  // Calculate last 7 days activity wave data
  const activityWave = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    }).reverse();

    const counts = last7Days.map(dateStr => {
      return activities.filter(a => a.timestamp && a.timestamp.startsWith(dateStr)).length;
    });

    const maxVal = Math.max(...counts, 4); // Min peak height of 4 to look balanced
    
    // SVG points calculation
    const points = counts.map((count, i) => {
      const x = 20 + i * 75; // spaced across 490px width
      const y = 85 - (count / maxVal) * 65; // mapped up to 80px height
      return { x, y, count, day: last7Days[i].slice(5) };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} 95 L ${points[0].x} 95 Z`;

    return { points, linePath, areaPath, totalStreak: counts.filter(c => c > 0).length };
  }, [activities]);

  const statCards = [
    {
      label: "已掌握",
      value: stats.mastered,
      desc: "掌握度较高的词汇数",
      icon: Target,
      color: "text-state-mastered",
      bg: "bg-state-mastered/10",
      border: "hover:border-state-mastered/30 hover:shadow-state-mastered/5",
    },
    {
      label: "学习中",
      value: stats.learning,
      desc: "处于记忆周期内的词汇数",
      icon: Zap,
      color: "text-state-learning",
      bg: "bg-state-learning/10",
      border: "hover:border-state-learning/30 hover:shadow-state-learning/5",
    },
    {
      label: "未学习",
      value: stats.newCount,
      desc: "尚未开始学习的词汇数",
      icon: Search,
      color: "text-state-due",
      bg: "bg-state-due/10",
      border: "hover:border-state-due/30 hover:shadow-state-due/5",
    },
    {
      label: "掌握率",
      value: stats.accuracy + "%",
      desc: "已掌握词汇占已学总量的比例",
      icon: TrendingUp,
      color: "text-state-accuracy",
      bg: "bg-state-accuracy/10",
      border: "hover:border-state-accuracy/30 hover:shadow-state-accuracy/5",
    },
  ];

  const actions = [
    {
      label: "开始拼写",
      desc: "逐字母拼写练习，拼过才记得住",
      icon: Pencil,
  Trophy,
  Flame,
  CalendarDays,
      path: "/spell",
      color: "text-brand",
      bg: "bg-brand/10",
      count: null,
      badge: "核心",
    },
    {
      label: "浏览词库",
      desc: "查看并学习新关键字",
      icon: Search,
      path: "/browse",
      color: "text-state-due",
      bg: "bg-state-due/10",
      count: stats.newCount,
      badge: "新内容",
    },
    {
      label: "语言对比",
      desc: "多语言关键字对照",
      icon: ArrowLeftRight,
      path: "/compare",
      color: "text-state-accuracy",
      bg: "bg-state-accuracy/10",
      count: null,
      badge: "对比",
    },
  ];

  return (
    <div className="space-y-6 animate-in max-w-4xl mx-auto">
      
      {/* Premium Hero greeting card with glassmorphism */}
      <div className="p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20 backdrop-blur-md relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-state-due/5 rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold">
              <Clock className="h-3.5 w-3.5" />
              {greeting.text}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BookMarked className="h-6 w-6 text-brand" />
              编程词库看板
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
              {greeting.desc}系统地学习与巩固你的 {Object.entries(LANGUAGES).filter(([k]) => (settings.selectedLanguages || []).includes(k)).map(([, l]) => l.label).join('、') || '编程'} 语言关键字。
            </p>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold shadow-sm self-start md:self-auto shrink-0">
            <span className="text-foreground">{stats.mastered}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{stats.total}</span>
            <span className="text-xs text-muted-foreground/80 font-medium ml-1">已记牢</span>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.label} 
            className={`border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${stat.border}`}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <p className="text-2xl font-bold font-mono text-foreground leading-none">
                  {stat.value}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                  {stat.desc}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dual Column: Progress and Learning Consistency */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Progress Card (Left Column) */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm md:col-span-5 flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-6">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  <p className="text-sm font-bold text-foreground">总体学习进度</p>
                </div>
                <span className="text-sm font-mono font-bold text-brand">
                  {progressPercent}%
                </span>
              </div>
              
              <Progress value={progressPercent} className="h-2" />
            </div>
            
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                <span>新卡片</span>
                <span className="font-mono text-foreground">{stats.newCount} 个</span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                <span>进行中</span>
                <span className="font-mono text-foreground">{stats.learning} 个</span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                <span>已掌握</span>
                <span className="font-mono text-state-mastered">{stats.mastered} 个</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity consistency Wave chart (Right Column) */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm md:col-span-7">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand" />
                <p className="text-sm font-bold text-foreground">近期学习趋势</p>
              </div>
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 近 7 日活跃 {activityWave.totalStreak} 天
              </span>
            </div>

            {/* SVG Consistency Wave Line */}
            <div className="relative h-24 w-full">
              <svg viewBox="0 0 490 100" className="w-full h-full overflow-visible">
                {/* Horizontal reference grid lines */}
                <line x1="10" y1="20" x2="480" y2="20" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/50" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="10" y1="55" x2="480" y2="55" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/50" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="10" y1="90" x2="480" y2="90" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/50" strokeWidth="0.5" />

                {/* Filled area with solid flat brand tint */}
                <path d={activityWave.areaPath} fill="hsl(var(--brand) / 0.06)" />

                {/* Smooth path line */}
                <path d={activityWave.linePath} fill="none" stroke="hsl(var(--brand))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points on wave */}
                {activityWave.points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="hsl(var(--brand))" strokeWidth="2" className="transition-all hover:r-6 cursor-pointer" />
                    {p.count > 0 && (
                      <text x={p.x} y={p.y - 8} textAnchor="middle" fill="hsl(var(--brand))" className="text-[9px] font-mono font-bold">
                        {p.count}
                      </text>
                    )}
                    <text x={p.x} y="102" textAnchor="middle" className="text-[8px] font-medium fill-muted-foreground font-mono">
                      {p.day}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <div
            key={action.path}
            className="p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm transition-all duration-300 hover:border-brand/40 hover:-translate-y-1 hover:shadow-md cursor-pointer group flex flex-col justify-between h-full min-h-[140px] relative overflow-hidden"
            onClick={() => navigate(action.path)}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-xl ${action.bg} ${action.color} group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                <action.icon className="h-4.5 w-4.5" />
              </div>
              
              <div className="flex items-center gap-2">
                {action.count !== null && (
                  <span className="text-[10px] font-mono font-bold bg-muted border border-border/40 px-1.5 py-0.5 rounded text-muted-foreground">
                    {action.count}
                  </span>
                )}
                <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                  {action.badge}
                </span>
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1 group-hover:text-brand transition-colors">
                {action.label}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {action.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Language affinities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(LANGUAGES).filter(([key]) => (settings.selectedLanguages || []).includes(key)).map(([key, lang]) => {
          const langCards = cards.filter((c) => c.language === key);
          const langMastered = langCards.filter(c => c.status === 'mastered').length;
          const langPercent = langCards.length > 0 ? Math.round((langMastered / langCards.length) * 100) : 0;
          
          return (
            <div 
              key={key} 
              className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm flex flex-col justify-between gap-3 group transition-all duration-300 hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${lang.bg} flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-inner`}>
                    <lang.icon className={`h-5 w-5 ${lang.color}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{lang.label} 词库</h4>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      共 {langCards.length} 个词汇 · 已学过 {langCards.filter(c => c.status !== 'new').length} 个
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border/50 px-2 py-0.5 rounded shadow-sm">
                  {lang.desc}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground/80 font-mono">
                  <span>掌握率</span>
                  <span>{langPercent}%</span>
                </div>
                <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      key === 'python' ? 'bg-lang-python' :
                      key === 'javascript' ? 'bg-lang-javascript' :
                      key === 'react' ? 'bg-lang-react' :
                      key === 'vue' ? 'bg-lang-vue' : 'bg-lang-nestjs'
                    }`} 
                    style={{ width: `${langPercent}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
