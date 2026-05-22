import React, { useState, useMemo, useEffect } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-typescript'
import 'prismjs/themes/prism-tomorrow.css'
import LANGUAGES from '../languages'
import db from '../db'
import { 
  Search, 
  X, 
  Lightbulb, 
  AlertTriangle, 
  Volume2, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  Calendar, 
  Flame, 
  Award,
  BookOpen,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import { playKeyword } from '../audio'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'

const statusConfig = {
  new: { label: '未学习', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/25', variant: 'secondary' },
  learning: { label: '复习中', color: 'text-brand bg-brand/10 border-brand/25', variant: 'ember' },
  review: { label: '复习中', color: 'text-brand bg-brand/10 border-brand/25', variant: 'ember' },
  mastered: { label: '已掌握', color: 'text-state-mastered bg-state-mastered/10 border-state-mastered/25', variant: 'success' },
}

export default function Browse({ cards, settings, onCardUpdate }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [langFilter, setLangFilter] = useState('all')
  const [selectedCard, setSelectedCard] = useState(null)
  
  // Spotlight mouse tracking state: stores relative coordinates of mouse for each card
  const [mousePos, setMousePos] = useState({})
  const [copied, setCopied] = useState(false)
  const [activeAccordion, setActiveAccordion] = useState('all') // 'all', 'code', 'context', 'mistakes'

  useEffect(() => {
    if (selectedCard) {
      // Highlight Prism code blocks once card is shown
      Prism.highlightAll()
      const handleEsc = (e) => { if (e.key === 'Escape') setSelectedCard(null) }
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [selectedCard, activeAccordion])

  // Track cursor position inside hover card
  const handleMouseMove = (e, cardId) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos(prev => ({
      ...prev,
      [cardId]: { x, y }
    }))
  }

  const filtered = useMemo(() => {
    let result = cards
    if (langFilter !== 'all') {
      result = result.filter(c => c.language === langFilter)
    }
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(c =>
        c.keyword.toLowerCase().includes(s) ||
        c.definition.toLowerCase().includes(s) ||
        (c.category && c.category.toLowerCase().includes(s))
      )
    }
    if (filter !== 'all') {
      result = result.filter(c => c.status === filter)
    }
    return result
  }, [cards, search, filter, langFilter])

  const stats = useMemo(() => ({
    total: cards.length,
    mastered: cards.filter(c => c.status === 'mastered').length,
    learning: cards.filter(c => c.status === 'review' || c.status === 'learning').length,
    newCount: cards.filter(c => c.status === 'new').length,
  }), [cards])

  const copyCode = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle toggling study status manually from drawer
  const handleStatusToggle = async () => {
    if (!selectedCard) return
    const isCurrentlyMastered = selectedCard.status === 'mastered'
    const newStatus = isCurrentlyMastered ? 'review' : 'mastered'
    
    // Create updated card object preserving original SRS properties or adjusting slightly
    const updated = {
      ...selectedCard,
      status: newStatus,
      repetitions: isCurrentlyMastered ? Math.max(0, selectedCard.repetitions - 1) : selectedCard.repetitions + 1,
      interval: isCurrentlyMastered ? 1 : 30, // standard interval jumps
    }
    
    await db.putCard(updated)
    setSelectedCard(updated)
    if (onCardUpdate) onCardUpdate()
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Search className="h-7 w-7 text-brand" /> 词库浏览器
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">检索、浏览和管理当前选择语言的全部编程关键词及其实战用法。</p>
      </div>

      {/* Cyber stats indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '总库容量', count: stats.total, style: 'border-state-due/30 text-state-due', glow: 'bg-state-due/5' },
          { label: '已掌握', count: stats.mastered, style: 'border-state-mastered/30 text-state-mastered', glow: 'bg-state-mastered/5' },
          { label: '复习中', count: stats.learning, style: 'border-brand/30 text-brand', glow: 'bg-brand/5' },
          { label: '未学习', count: stats.newCount, style: 'border-zinc-500/30 text-zinc-400', glow: 'bg-zinc-500/5' },
        ].map((s, idx) => (
          <div key={idx} className={`glass-panel p-3.5 rounded-2xl border ${s.style} ${s.glow} flex flex-col justify-between`}>
            <span className="text-xs text-muted-foreground font-semibold">{s.label}</span>
            <span className="text-2xl font-extrabold font-mono tracking-tight mt-1">{s.count}</span>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索关键字、释义或分类标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 bg-zinc-900/30 border-border/80 rounded-xl focus-visible:ring-brand/40"
          />
          {search && (
            <button 
              onClick={() => setSearch('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '全部语言' },
              ...Object.entries(LANGUAGES).filter(([key]) => (settings.selectedLanguages || []).includes(key)).map(([key, lang]) => ({ value: key, label: lang.label, icon: lang.icon, iconClass: lang.color })),
            ].map(f => (
              <Button 
                key={f.value} 
                variant={langFilter === f.value ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setLangFilter(f.value)} 
                className={`gap-1.5 text-xs font-bold transition-all rounded-lg ${
                  langFilter === f.value 
                    ? 'bg-brand text-brand-foreground shadow-md shadow-brand/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.icon && <f.icon className={`h-3.5 w-3.5 ${f.iconClass}`} />}
                {f.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '全部状态' }, 
              { value: 'mastered', label: '已掌握' }, 
              { value: 'review', label: '复习中' }, 
              { value: 'new', label: '未学习' }
            ].map(f => (
              <Button 
                key={f.value} 
                variant={filter === f.value ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter(f.value)}
                className={`text-xs font-bold rounded-lg ${
                  filter === f.value
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Keywords Grid with mouse-tracking Spotlight halos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(card => {
          const cardId = card.keyword + '::' + card.language
          const lang = LANGUAGES[card.language] || { label: card.language, color: 'text-zinc-500' }
          const status = statusConfig[card.status] || { label: card.status, color: 'text-zinc-400' }
          
          return (
            <div
              key={cardId}
              onMouseMove={(e) => handleMouseMove(e, cardId)}
              onClick={() => setSelectedCard(card)}
              className="spotlight-card glass-panel border border-border/40 p-5 rounded-2xl cursor-pointer hover-scale flex flex-col justify-between gap-3 min-h-[160px] group/card relative overflow-hidden"
            >
              {/* Dynamic spotlight halo container */}
              <div
                className="spotlight-glow"
                style={{
                  left: mousePos[cardId]?.x || 0,
                  top: mousePos[cardId]?.y || 0
                }}
              />

              <div className="relative z-10 space-y-2">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className={`text-[10px] gap-1 py-0 px-2 font-bold ${lang.bg || 'bg-zinc-500/10'}`}>
                    <lang.icon className={`h-3 w-3 ${lang.color}`} />
                    {lang.label}
                  </Badge>
                  
                  <Badge variant="outline" className={`text-[10px] py-0 px-2 font-bold border-none ${status.color}`}>
                    {status.label}
                  </Badge>
                </div>

                <h3 className="font-extrabold font-mono text-xl group-hover/card:text-brand transition-colors pt-1">
                  {card.keyword}
                </h3>
                
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {card.definition}
                </p>
              </div>

              {/* Card Footer */}
              <div className="relative z-10 flex justify-between items-center text-[10px] text-muted-foreground/60 border-t border-border/20 pt-2.5">
                <span className="font-mono">Category: {card.category || 'Core'}</span>
                <span className="flex items-center gap-1 group-hover/card:text-brand transition-colors font-bold uppercase text-[9px] tracking-wider">
                  查看详情 <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <Card className="glass-panel border-dashed p-12 text-center max-w-md mx-auto">
          <CardContent className="space-y-3 pt-6">
            <div className="p-3 bg-zinc-800 rounded-full w-fit mx-auto text-muted-foreground">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">没有找到匹配的关键字</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              请尝试调整搜索字词，或是更改顶部的语言与学习状态过滤器。
            </p>
          </CardContent>
        </Card>
      )}

      {/* RIGHT SLIDE-OUT DETAIL DRAWER */}
      {selectedCard && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in"
          onClick={() => setSelectedCard(null)}
        >
          <div 
            className="w-full max-w-lg h-full bg-background/95 backdrop-blur-2xl border-l border-border/60 shadow-2xl flex flex-col animate-slide-in p-6 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold gap-1 bg-zinc-900">
                  {(() => {
                    const L = LANGUAGES[selectedCard.language]
                    return L ? <><L.icon className={`h-3.5 w-3.5 ${L.color}`} /> {L.label}</> : selectedCard.language
                  })()}
                </Badge>
                
                <Badge variant="outline" className={`text-xs font-bold border-none ${statusConfig[selectedCard.status]?.color}`}>
                  {statusConfig[selectedCard.status]?.label}
                </Badge>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-zinc-800"
                onClick={() => setSelectedCard(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Keyword Title & TTS Speaking */}
            <div className="py-6 space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-extrabold font-mono text-3xl text-brand tracking-tight">{selectedCard.keyword}</h2>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9 rounded-full border-brand/20 bg-brand/5 hover:bg-brand/10 text-brand transition-all hover:scale-105"
                  onClick={() => playKeyword(selectedCard.keyword)}
                  title="朗读关键字"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Definition */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-brand" /> 释义
                </span>
                <p className="text-sm leading-relaxed text-foreground bg-zinc-900/40 p-4 rounded-xl border border-border/30 whitespace-pre-wrap">
                  {selectedCard.definition}
                </p>
              </div>
            </div>

            {/* Content Accordions */}
            <div className="flex-1 space-y-4 pb-6">
              
              {/* ACCORDION TABS CONTROLLERS */}
              <div className="flex border-b border-border/30 gap-4 text-xs font-bold">
                <button 
                  onClick={() => setActiveAccordion('all')}
                  className={`pb-2 border-b-2 transition-all ${activeAccordion === 'all' ? 'border-brand text-brand' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  核心技能
                </button>
                <button 
                  onClick={() => setActiveAccordion('srs')}
                  className={`pb-2 border-b-2 transition-all ${activeAccordion === 'srs' ? 'border-brand text-brand' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  记忆参数
                </button>
              </div>

              {activeAccordion === 'all' && (
                <div className="space-y-4 animate-in">
                  {/* Code Example */}
                  {selectedCard.code_example && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Lightbulb className="h-3.5 w-3.5 text-brand" /> 代码实战
                        </span>
                        
                        <Button 
                          variant="ghost" 
                          size="xs" 
                          className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => copyCode(selectedCard.code_example)}
                        >
                          {copied ? (
                            <><Check className="h-3.5 w-3.5 text-emerald-500" /> <span className="text-emerald-500">已复制</span></>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" /> 复制代码</>
                          )}
                        </Button>
                      </div>

                      {/* Code Block Window */}
                      <div className="rounded-xl border border-border/40 overflow-hidden shadow-xl bg-zinc-950 flex flex-col">
                        <div className="bg-[#1e1e24] px-4 py-1.5 border-b border-[#2d2d39] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                          <span className="text-[10px] font-mono text-zinc-500 ml-2 select-none">
                            snippet.{LANGUAGES[selectedCard.language]?.prism || 'txt'}
                          </span>
                        </div>
                        <div className="p-4 overflow-auto font-mono text-xs max-h-[220px]">
                          <pre className="p-0 m-0 bg-transparent overflow-x-auto whitespace-pre"><code className={`language-${LANGUAGES[selectedCard.language]?.prism || selectedCard.language}`}>{selectedCard.code_example}</code></pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Usage Context */}
                  {selectedCard.usage_context && selectedCard.usage_context.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-brand" /> 使用场景
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedCard.usage_context.map(u => (
                          <Badge key={u} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-border/40 py-1 text-xs">
                            {u}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Mistakes */}
                  {selectedCard.common_mistakes && selectedCard.common_mistakes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-400" /> 常见雷区
                      </span>
                      
                      <div className="bg-red-500/[0.03] border border-red-500/10 p-4 rounded-xl space-y-2">
                        {selectedCard.common_mistakes.map((m, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeAccordion === 'srs' && (
                <div className="space-y-5 animate-in">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '熟练指数', val: `${selectedCard.easeFactor?.toFixed(1) || '2.5'}x`, icon: Flame, color: 'text-brand' },
                      { label: '复习次数', val: `${selectedCard.repetitions || 0} 次`, icon: RefreshCw, color: 'text-blue-400' },
                      { label: '复习间隔', val: `${selectedCard.interval || 0} 天`, icon: Calendar, color: 'text-cyan-400' },
                    ].map((m, idx) => (
                      <div key={idx} className="glass-panel p-3 rounded-xl border border-border/30 flex flex-col items-center justify-center text-center space-y-1">
                        <m.icon className={`h-4 w-4 ${m.color}`} />
                        <span className="text-[10px] text-muted-foreground">{m.label}</span>
                        <span className="text-sm font-extrabold font-mono text-foreground">{m.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Quick database operations */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">快速掌控操作</div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleStatusToggle}
                        className={`flex-1 font-semibold text-xs py-2 rounded-xl border transition-all ${
                          selectedCard.status === 'mastered'
                            ? 'border-brand/20 bg-brand/5 hover:bg-brand/10 text-brand'
                            : 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {selectedCard.status === 'mastered' ? '重置并放回复习池' : '标记此卡为[已掌握]'}
                      </Button>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground/60 leading-normal">
                      操作提示：标记为已掌握的卡片将从拼写和闪卡练习中移出，若重置为复习中则会重新加入每日随机学习队列。
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
