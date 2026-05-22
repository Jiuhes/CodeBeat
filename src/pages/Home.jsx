import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ChevronRight, Brain, Pencil, RotateCcw, Volume2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 py-12 md:py-20 animate-in max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-5">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
          还在 <span className="line-through text-muted-foreground">死记硬背</span>？<br />
          换种方式记关键词
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          听发音、拼单词、做选择题。<br />每天几分钟，169 个编程关键词自然记住。
        </p>
        <Button onClick={() => navigate('/auth')}
          className="px-6 h-11 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/15 cursor-pointer">
          免费开始 <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Learning modes — what YOU will do */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-center">三种练法，总有一种适合你</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Brain, title: '选择题', desc: '看关键词选释义，快速过一遍。适合刚接触新词。', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { icon: Pencil, title: '拼写', desc: '听发音拼单词，逐字母即时反馈。拼过才记得住。', color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { icon: RotateCcw, title: '闪卡复习', desc: '翻卡片自评掌握度，系统自动安排下次复习时间。', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          ].map(item => (
            <div key={item.title} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <h3 className="font-bold text-sm">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What you'll learn */}
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-bold">覆盖 5 种语言</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { name: 'Python', count: 44 },
            { name: 'JavaScript', count: 47 },
            { name: 'React', count: 17 },
            { name: 'Vue', count: 24 },
            { name: 'NestJS', count: 37 },
          ].map(lang => (
            <div key={lang.name} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="text-sm font-medium">{lang.name}</span>
              <span className="text-xs text-muted-foreground ml-1.5">{lang.count} 词</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it actually works */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-center">记住的原理</h2>
        <div className="space-y-4">
          {[
            { n: '1', text: '你学一个新词，系统记录你的掌握程度' },
            { n: '2', text: '快忘记的时候自动提醒你复习（间隔重复算法）' },
            { n: '3', text: '复习越多，间隔越长，直到真正记住' },
          ].map(item => (
            <div key={item.n} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{item.n}</span>
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="text-center space-y-3 pt-4">
        <p className="text-sm text-muted-foreground">数据存在浏览器本地，不上传，断网也能用。</p>
        <Button onClick={() => navigate('/auth')}
          className="px-6 h-10 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white cursor-pointer">
          立即开始
        </Button>
      </div>
    </div>
  );
}
