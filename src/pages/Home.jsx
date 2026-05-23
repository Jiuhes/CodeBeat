import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import db from "../db";
import {
  ChevronRight,
  Pencil,
  Keyboard,
  Zap,
  Target,
  TrendingUp,
  Play,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const handleGuest = async () => {
    try {
      await db.guestLogin();
      window.location.href = "/spell";
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-16 py-12 md:py-20 animate-in max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-semibold mb-2">
          <Pencil className="h-3.5 w-3.5" />
          拼写驱动记忆
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
          手指记住了
          <br />
          大脑就记住了
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          逐字母拼写编程关键字，拼错即时纠正。
          <br />
          肌肉记忆 + 间隔复习，比死记硬背快 3 倍。
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={handleGuest}
            variant="outline"
            className="px-5 h-11 rounded-xl font-semibold border-orange-500/30 text-orange-500 hover:bg-orange-500/10 cursor-pointer"
          >
            <Play className="h-4 w-4 mr-1.5" /> 试试看
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            className="px-5 h-11 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/15 cursor-pointer"
          >
            免费注册 <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* How spelling works - Visual demo */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-center">拼写即记忆</h2>
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="bg-white dark:bg-zinc-950 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-500">
                JS
              </span>
              <span className="text-xs text-muted-foreground">控制流</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">释义</p>
              <p className="text-sm">
                遍历可迭代对象（Array、String、Map、Set 等）的值。
              </p>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-lg tracking-wider">
              <span className="text-emerald-500">f</span>
              <span className="text-emerald-500">o</span>
              <span className="text-emerald-500">r</span>
              <span className="text-emerald-500">.</span>
              <span className="text-emerald-500">.</span>
              <span className="text-emerald-500">.</span>
              <span className="text-orange-500 border-b-2 border-orange-500 animate-pulse">
                o
              </span>
              <span className="text-muted-foreground/30">f</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            拼错自动纠正，连续错误触发提示
          </p>
        </div>
      </div>

      {/* Why spelling */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-center">为什么选拼写</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Keyboard,
              title: "手指记忆",
              desc: "打字形成肌肉记忆，比看一眼强 10 倍",
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
            {
              icon: Target,
              title: "即时反馈",
              desc: "拼错立刻纠正，不给错误留机会",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              icon: TrendingUp,
              title: "自动复习",
              desc: "间隔重复算法，快忘的时候自动提醒",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3"
            >
              <div
                className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}
              >
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <h3 className="font-bold text-sm">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-bold">覆盖 5 种语言</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { name: "Python", count: 44 },
            { name: "JavaScript", count: 47 },
            { name: "React", count: 17 },
            { name: "Vue", count: 24 },
            { name: "NestJS", count: 37 },
          ].map((lang) => (
            <div
              key={lang.name}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <span className="text-sm font-medium">{lang.name}</span>
              <span className="text-xs text-muted-foreground ml-1.5">
                {lang.count} 词
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { n: "169", label: "个编程关键字" },
          { n: "5", label: "种编程语言" },
          { n: "0", label: "元，永久免费" },
        ].map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="text-2xl font-bold text-orange-500">{item.n}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="text-center space-y-3 pt-4">
        <p className="text-sm text-muted-foreground">
          数据存在浏览器本地，不上传，断网也能用。
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={handleGuest}
            variant="outline"
            className="px-5 h-10 rounded-xl font-semibold border-orange-500/30 text-orange-500 hover:bg-orange-500/10 cursor-pointer"
          >
            <Play className="h-4 w-4 mr-1.5" /> 先试试
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            className="px-5 h-10 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
          >
            注册账号
          </Button>
        </div>
      </div>
    </div>
  );
}
