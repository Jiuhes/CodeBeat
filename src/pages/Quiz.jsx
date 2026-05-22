import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LANGUAGES from '../languages'
import db from '../db'
import { sm2 } from '../srs'
import { playKeyword, playSound } from '../audio'
import {
  CheckCircle,
  XCircle,
  Volume2,
  ArrowRight,
  RotateCcw,
  Brain,
  Layers,
  Trophy,
  ThumbsUp,
  Activity,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const FALLBACK_DISTRACTORS = [
  "一种用于多线程编程中实现资源排他性访问的同步互斥锁机制。",
  "在函数式编程中，通过把多参数函数转化为一系列单参数函数链的技术。",
  "数据库事务执行过程中为保证数据一致性与并发控制而采用的数据锁定策略。",
  "网络通信中由于缓冲区溢出或处理不及时导致的数据分组丢失现象。",
  "一种允许对象在其内部状态改变时改变其行为的行为型设计模式。",
  "内存管理中为了提高分配效率而预先申请并维护的一块连续内存区域。",
  "分布式系统中为保证服务高可用性而在多个节点间复制状态的数据一致性算法。",
  "前端页面渲染过程中，由于样式或 DOM 结构改变导致浏览器重新计算布局的行为。",
  "面向对象设计中，子类能够替换其基类且软件单位的功能不受影响的继承设计原则。",
  "一种利用哈希函数将任意长度输入映射为固定长度输出的单向加密编码算法。"
]

function generateQuestions(cards, count, selectedLanguage, maxNew) {
  const pool = cards
    .filter(c => selectedLanguage === 'all' || c.language === selectedLanguage)
  if (pool.length === 0) return []
  const newCards = shuffle(pool.filter(c => c.status === 'new')).slice(0, maxNew)
  const reviewCards = shuffle(pool.filter(c => c.status !== 'new'))
  const selected = shuffle([...newCards, ...reviewCards]).slice(0, Math.min(count, pool.length))
  return selected.map(card => {
    let others = cards.filter(c => c.keyword !== card.keyword && c.language === card.language)
    if (others.length < 3) {
      others = cards.filter(c => c.keyword !== card.keyword)
    }
    
    const distractors = []
    const shuffledOthers = shuffle(others)
    for (const o of shuffledOthers) {
      if (distractors.length >= 3) break
      if (o.definition !== card.definition && !distractors.includes(o.definition)) {
        distractors.push(o.definition)
      }
    }
    
    if (distractors.length < 3) {
      const shuffledFallbacks = shuffle(FALLBACK_DISTRACTORS)
      for (const fallback of shuffledFallbacks) {
        if (distractors.length >= 3) break
        if (fallback !== card.definition && !distractors.includes(fallback)) {
          distractors.push(fallback)
        }
      }
    }
    
    while (distractors.length < 3) {
      distractors.push("在特定上下文或编程语言中实现特定计算逻辑的通用程序组件。")
    }
    
    const options = shuffle([card.definition, ...distractors])
    return {
      card,
      options,
      correctIndex: options.indexOf(card.definition),
    }
  })
}

export default function Quiz({ cards, settings }) {
  const navigate = useNavigate()
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const langCounts = useMemo(() => {
    const counts = {}
    for (const key of Object.keys(LANGUAGES)) {
      counts[key] = cards.filter(c => c.language === key).length
    }
    return counts
  }, [cards])
  const totalCount = cards.length

  const start = (lang) => {
    setSelectedLanguage(lang)
    const qs = generateQuestions(cards, settings.dailyReviewCards, lang, settings.dailyNewCards)
    setQuestions(qs)
    setStarted(true)
    setCurrentQ(0)
    setCorrectCount(0)
    setDone(false)
    setSelected(null)
    setAnswered(false)
    setStartTime(Date.now())
  }

  useEffect(() => {
    if (started && !done) {
      const timer = setInterval(() => {
        setElapsed(Math.round((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [started, done, startTime])

  const handleSelect = async (index) => {
    if (answered) return
    setSelected(index)
    setAnswered(true)
    const card = questions[currentQ].card
    const isCorrect = index === questions[currentQ].correctIndex
    const quality = isCorrect ? 4 : 0
    if (isCorrect) {
      setCorrectCount(c => c + 1)
      playSound('correct')
    } else {
      playSound('wrong')
    }
    await db.addActivity({ type: 'quiz', keyword: card.keyword, language: card.language, quality })
    if (card.status === 'new') {
      const updates = sm2(card, quality)
      await db.putCard({ ...card, ...updates })
    }
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setDone(true)
    }
  }

  // ── Empty State ──
  if (totalCount === 0 && !done) {
    return (
      <div className='flex flex-col items-center justify-center py-16 animate-in text-center max-w-md mx-auto'>
        <Brain className='h-16 w-16 text-brand mb-6 mx-auto animate-pulse' />
        <h2 className='text-xl font-bold mb-2 text-zinc-800 dark:text-zinc-100'>
          暂无可练习词汇
        </h2>
        <p className='text-muted-foreground mb-6 text-sm leading-relaxed font-medium'>
          词库中还没有卡片，去添加一些关键字吧。
        </p>
        <div className='flex gap-3 justify-center w-full'>
          <Button variant="outline" onClick={() => navigate('/')}>
            返回首页
          </Button>
          <Button onClick={() => navigate('/browse')}>
            去浏览词库
          </Button>
        </div>
      </div>
    )
  }

  // ── Language Selection Screen ──
  if (!selectedLanguage) {
    return (
      <div className='max-w-2xl mx-auto space-y-8 py-4 animate-in'>
        <div className='text-center space-y-3'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 dark:bg-brand/20 mb-2 shadow-sm'>
            <Brain className='h-8 w-8 text-brand' />
          </div>
          <h1 className='text-2xl font-bold text-zinc-800 dark:text-zinc-100'>选择练习语言</h1>
          <p className='text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium'>选择你想要练习的编程语言，练习新词并巩固已学词汇。</p>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          {Object.entries(LANGUAGES).filter(([key]) => (settings.selectedLanguages || []).includes(key)).map(([key, lang]) => {
            const count = langCounts[key]
            return (
              <button
                key={key}
                onClick={() => count > 0 && start(key)}
                disabled={count === 0}
                className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all duration-300 ${
                  count > 0
                    ? `border-zinc-200 dark:border-zinc-800 ${lang.hover} hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`
                    : 'border-zinc-100 dark:border-zinc-900 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className={`w-12 h-12 rounded-xl ${lang.bg} flex items-center justify-center shadow-inner`}>
                    <lang.icon className={`h-6 w-6 ${lang.color}`} />
                  </div>
                  <Badge variant='secondary' className='text-xs font-mono font-bold'>{count} 个词</Badge>
                </div>
                <h3 className='text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1'>{lang.label}</h3>
                {count > 0 && <div className={`absolute inset-0 ${lang.glow} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => start('all')}
          className='w-full group rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-brand dark:hover:border-brand p-5 flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-md hover:shadow-brand/5 cursor-pointer'
        >
          <Layers className='h-5 w-5 text-brand' />
          <span className='text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-brand transition-colors'>混合练习所有语言词汇</span>
          <Badge variant='outline' className='text-[11px] font-mono font-bold'>{totalCount} 个词</Badge>
        </button>
      </div>
    )
  }

  if (!started) return null

  // ── Test Complete / Finished ──
  if (done) {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
    return (
      <div className='max-w-2xl mx-auto space-y-6 animate-in'>
        <Card className='border border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm shadow-xl overflow-hidden'>
          <CardContent className='p-8 text-center space-y-6'>
            <div className='flex justify-center mb-2'>
              {accuracy >= 80 ? (
                <Trophy className="h-16 w-16 text-state-learning" />
              ) : accuracy >= 60 ? (
                <ThumbsUp className="h-16 w-16 text-state-mastered" />
              ) : (
                <Activity className="h-16 w-16 text-state-learning" />
              )}
            </div>
            <div className='space-y-2'>
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
                测试小结
              </div>
              <h2 className='text-2xl font-bold text-zinc-800 dark:text-zinc-100'>测试完成</h2>
              <p className='text-xs text-muted-foreground font-bold'>
                {accuracy >= 80 ? '测试通过，词汇掌握状态良好。' : accuracy >= 60 ? '表现良好，部分概念仍需巩固。' : '掌握程度一般，建议稍后重新复习测验。'}
              </p>
            </div>

            <div className='max-w-sm mx-auto bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 my-6 space-y-4 shadow-sm'>
              <div className='grid grid-cols-3 gap-4 items-center justify-center'>
                <div className='flex flex-col items-center justify-center'>
                  <p className='text-3xl font-extrabold text-state-mastered font-mono'>{correctCount}</p>
                  <p className='text-[10px] text-muted-foreground mt-1.5 font-bold'>正确</p>
                </div>
                <div className='flex flex-col items-center justify-center'>
                  <p className='text-3xl font-extrabold text-rating-again font-mono'>{questions.length - correctCount}</p>
                  <p className='text-[10px] text-muted-foreground mt-1.5 font-bold'>错误</p>
                </div>
                <div className='flex flex-col items-center justify-center'>
                  <p className={`text-3xl font-extrabold font-mono ${
                    accuracy >= 80 ? 'text-state-mastered' :
                    accuracy >= 60 ? 'text-state-learning' : 'text-rating-again'
                  }`}>{accuracy}%</p>
                  <p className='text-[10px] text-muted-foreground mt-1.5 font-bold'>正确率</p>
                </div>
              </div>
              <Progress value={accuracy} className="h-1.5" />
            </div>
            <p className='text-muted-foreground text-xs font-semibold'>
              用时 {Math.floor(elapsed / 60)}分{elapsed % 60}秒
            </p>
            <div className='flex gap-3 justify-center pt-2'>
              <Button onClick={() => start(selectedLanguage)} className='bg-brand hover:bg-brand/90 text-brand-foreground rounded-xl font-bold shadow-md shadow-brand/10 hover:scale-105 active:scale-95 transition-all'>
                <RotateCcw className='h-4 w-4 mr-2' />
                再来一轮
              </Button>
              <Button variant='outline' onClick={() => navigate('/')} className='rounded-xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'>
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const q = questions[currentQ]
  const isCorrect = selected === q.correctIndex

  const optionLetters = ['A', 'B', 'C', 'D']
  const optionThemeGlows = [
    'hover:border-state-due/40 hover:shadow-state-due/5',
    'hover:border-state-accuracy/40 hover:shadow-state-accuracy/5',
    'hover:border-brand/40 hover:shadow-brand/5',
    'hover:border-state-mastered/40 hover:shadow-state-mastered/5'
  ]

  return (
    <div className='max-w-2xl mx-auto space-y-6 animate-in select-none'>
      {/* Header */}
      <div className='flex items-center justify-between px-1'>
        <h1 className='text-xl font-bold flex items-center gap-2'>
          <Brain className="h-5 w-5 text-brand" />
          练习测试
        </h1>
        
        {/* Visual stopwatch beating */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground/80">
            <Clock className="w-3.5 h-3.5 text-brand animate-pulse" />
            <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
          </div>
          <Badge variant='secondary' className="font-bold">
            {currentQ + 1} / {questions.length}
          </Badge>
        </div>
      </div>

      <Progress value={((currentQ + 1) / questions.length) * 100} className='h-1.5 shadow-inner' />

      {/* Slide Remount Card (Key triggers mount transition) */}
      <Card key={currentQ} className='border border-zinc-200 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-950/20 backdrop-blur-sm animate-in'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Badge variant={q.card.language === 'python' ? 'default' : 'secondary'} className="font-bold">
              <span className="flex items-center gap-1">
                {(() => { const L = LANGUAGES[q.card.language]; return L ? <><L.icon className={`h-3.5 w-3.5 ${L.color}`} /> {L.label}</> : q.card.language; })()}
              </span>
            </Badge>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => playKeyword(q.card.keyword)}
              className='h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900'
            >
              <Volume2 className='h-4 w-4' />
            </Button>
          </div>
          <h2 className='text-4xl font-bold font-mono text-brand mb-6 tracking-wide'>
            {q.card.keyword}
          </h2>

          <div className='space-y-3.5'>
            {q.options.map((opt, i) => {
              let style = `border-zinc-200 dark:border-zinc-800 ${optionThemeGlows[i]} hover:bg-zinc-500/[0.01]`
              if (answered) {
                if (i === q.correctIndex) {
                  style = 'border-state-mastered bg-state-mastered/10 text-state-mastered shadow-sm shadow-state-mastered/10 scale-[1.01]'
                } else if (i === selected && !isCorrect) {
                  style = 'border-rating-again bg-rating-again/10 text-rating-again shadow-sm shadow-rating-again/10 scale-[1.01]'
                } else {
                  style = 'border-zinc-100 dark:border-zinc-900 opacity-40'
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 text-sm font-semibold cursor-pointer ${
                    answered ? 'cursor-default' : 'hover:-translate-y-0.5 active:scale-98'
                  } ${style}`}
                >
                  <div className='flex items-start gap-3.5'>
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shadow-sm ${
                      answered && i === q.correctIndex ? 'bg-state-mastered border-state-mastered text-white' :
                      answered && i === selected && !isCorrect ? 'bg-rating-again border-rating-again text-white' :
                      'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {optionLetters[i]}
                    </span>
                    <span className='flex-1 leading-relaxed'>{opt.split('\n')[0]}</span>
                    {answered && i === q.correctIndex && (
                      <CheckCircle className='h-5 w-5 text-state-mastered flex-shrink-0 ml-2 animate-in zoom-in-50' />
                    )}
                    {answered && i === selected && !isCorrect && (
                      <XCircle className='h-5 w-5 text-rating-again flex-shrink-0 ml-2 animate-in zoom-in-50' />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {answered && (
            <div className='mt-6 flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300'>
              <Button onClick={handleNext} className='bg-brand hover:bg-brand/90 text-brand-foreground font-bold rounded-xl h-10 px-6 shadow-md shadow-brand/10 hover:scale-105 active:scale-95 transition-all'>
                {currentQ < questions.length - 1 ? '下一题' : '查看结果'}
                <ArrowRight className='h-4 w-4 ml-1.5' />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
