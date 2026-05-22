import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/themes/prism-tomorrow.css'
import LANGUAGES from '../languages'
import db from '../db'
import { sm2 } from '../srs'
import { playSound, playKeyword } from '../audio'
import {
  Volume2,
  ArrowRight,
  RotateCcw,
  Flame,
  Layers,
  Trophy,
  ThumbsUp,
  Activity,
  CheckCircle,
  XCircle,
  SkipForward,
  HelpCircle,
  Zap,
  CornerDownLeft,
  Delete,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Spell({ cards, settings }) {
  const navigate = useNavigate()
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [difficulty, setDifficulty] = useState(null) // 'easy' | 'normal' | 'hard'
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [typed, setTyped] = useState('')
  const [letterResults, setLetterResults] = useState([]) // 'correct' | 'wrong' | 'empty'
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [sessionStats, setSessionStats] = useState([])
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [heat, setHeat] = useState(0) // 0-100 forge heat
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [hintCount, setHintCount] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)
  const [shake, setShake] = useState(false)
  const [lastPressedKey, setLastPressedKey] = useState(null)

  const inputRef = useRef(null)

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Auto focus input when active
  useEffect(() => {
    if (started && !done && !answered) {
      focusInput()
    }
  }, [started, done, answered, currentQ, focusInput])

  const langCounts = useMemo(() => {
    const counts = {}
    for (const key of Object.keys(LANGUAGES)) counts[key] = cards.filter(c => c.language === key).length
    return counts
  }, [cards])
  const totalCount = cards.length

  const resetQuestion = useCallback(() => {
    setTyped(''); setLetterResults([]); setAnswered(false); setIsCorrect(false)
    setConsecutiveErrors(0); setHintCount(0); setShowHint(false); setCursorVisible(true); setShake(false)
  }, [])

  const start = (lang) => {
    const pool = cards.filter(c => lang === 'all' || c.language === lang)
    const newCards = shuffle(pool.filter(c => c.status === 'new')).slice(0, settings.dailyNewCards)
    const reviewCards = shuffle(pool.filter(c => c.status !== 'new'))
    const selected = shuffle([...newCards, ...reviewCards]).slice(0, settings.dailyReviewCards)
    setQuestions(selected); setStarted(true); setCurrentQ(0); setCorrectCount(0); setDone(false)
    setStartTime(Date.now()); setSessionStats([]); setStreak(0); setMaxStreak(0); setHeat(0); resetQuestion()
    if (selected.length > 0) setTimeout(() => playKeyword(selected[0].keyword), 250)
  }

  useEffect(() => {
    if (started && !done) {
      const timer = setInterval(() => setElapsed(Math.round((Date.now() - startTime) / 1000)), 1000)
      return () => clearInterval(timer)
    }
  }, [started, done, startTime])

  useEffect(() => { if (answered) Prism.highlightAll() }, [answered])

  useEffect(() => {
    if (answered || done) return
    const timer = setInterval(() => setCursorVisible(v => !v), 530)
    return () => clearInterval(timer)
  }, [answered, done, currentQ])

  const card = questions[currentQ]
  const keyword = card?.keyword || ''

  // Virtual key typing support
  const typeCharacter = useCallback((char) => {
    if (answered) return
    if (typed.length >= keyword.length) return

    const pos = typed.length
    // Case insensitive comparison for coding keyword but keep casing consistent
    const expectedChar = keyword[pos]
    const isCorrectLetter = char.toLowerCase() === expectedChar.toLowerCase()
    
    // We append the expected character casing to respect precise programming syntax (e.g. None, True)
    const charToAppend = isCorrectLetter ? expectedChar : char
    const newTyped = typed + charToAppend

    if (isCorrectLetter) {
      setConsecutiveErrors(0)
    } else {
      const newErrors = consecutiveErrors + 1
      setConsecutiveErrors(newErrors)
      if (newErrors >= 3 && !showHint) {
        setShowHint(true)
        setHintCount(pos + 1)
      }
    }

    setTyped(newTyped)
    setLastPressedKey(char.toLowerCase())
    setTimeout(() => setLastPressedKey(null), 120)

    if (newTyped.length === keyword.length) {
      setTimeout(() => completeWord(newTyped.toLowerCase() === keyword.toLowerCase()), 150)
    }
  }, [typed, keyword, answered, consecutiveErrors, showHint])

  const deleteCharacter = useCallback(() => {
    if (answered || typed.length === 0) return
    setTyped(prev => prev.slice(0, -1))
    setConsecutiveErrors(0)
  }, [answered, typed])

  const handleInputChange = (e) => {
    if (answered) return
    const val = e.target.value
    
    // Support deletions
    if (val.length < typed.length) {
      setTyped(val)
      return
    }

    const diff = val.slice(typed.length)
    if (!diff) return

    // Type the characters
    for (let char of diff) {
      typeCharacter(char)
    }
  }

  // Update letter results
  useEffect(() => {
    if (!card) return
    const results = keyword.split('').map((letter, i) => {
      if (i < typed.length) return typed[i].toLowerCase() === letter.toLowerCase() ? 'correct' : 'wrong'
      if (showHint && i < hintCount) return 'hint'
      return 'empty'
    })
    setLetterResults(results)
  }, [typed, hintCount, keyword, card, showHint])

  const getForgeGlowClass = () => {
    if (heat >= 80) return 'forge-glow-white'
    if (heat >= 50) return 'forge-glow-hot'
    if (heat >= 20) return 'forge-glow-warm'
    return 'border-zinc-200 dark:border-zinc-800'
  }

  const completeWord = async (correct, skipped = false) => {
    setAnswered(true); setIsCorrect(correct)
    if (correct) {
      setCorrectCount(c => c + 1); playSound('correct')
      setStreak(s => { const ns = s + 1; setMaxStreak(m => Math.max(m, ns)); return ns })
      setHeat(h => Math.min(100, h + 15))
    } else {
      playSound('wrong'); setStreak(0)
      setHeat(h => Math.max(0, h - 20))
      setShake(true); setTimeout(() => setShake(false), 500)
    }
    const quality = correct ? 4 : 0
    await db.addActivity({ type: 'spell', keyword: card.keyword, language: card.language, quality })
    if (card.status === 'new') await db.putCard({ ...card, ...sm2(card, quality) })
    setSessionStats(prev => [...prev, { keyword: card.keyword, language: card.language, category: card.category, correct, input: typed, skipped }])
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1); resetQuestion()
      setTimeout(() => { if (questions[currentQ + 1]) playKeyword(questions[currentQ + 1].keyword) }, 250)
    } else { setDone(true) }
  }

  // Keyboard Event Handlers
  useEffect(() => {
    if (!started || done) return
    const handler = (e) => {
      // Focus element check
      if (document.activeElement !== inputRef.current) {
        focusInput()
      }

      if (e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        if (card) playKeyword(card.keyword)
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        if (answered) { handleNext(); return }
        if (typed.length === keyword.length) completeWord(typed.toLowerCase() === keyword.toLowerCase())
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        deleteCharacter()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!answered) {
          if (!showHint) { setShowHint(true); setHintCount(1) }
          else if (hintCount < keyword.length) setHintCount(h => h + 1)
        }
        return
      }

      if (e.key === 'ArrowRight' && !answered) {
        e.preventDefault()
        completeWord(false, true)
        return
      }

      const char = e.key.toLowerCase()
      if (char.length === 1 && char >= 'a' && char <= 'z') {
        setLastPressedKey(char)
        setTimeout(() => setLastPressedKey(null), 120)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [started, done, answered, card, typed, keyword, consecutiveErrors, hintCount, showHint, deleteCharacter, typeCharacter])

  // ── Empty State ──
  if (totalCount === 0 && !done) {
    return (
      <div className='flex flex-col items-center justify-center py-16 animate-in text-center max-w-md mx-auto'>
        <Flame className='h-16 w-16 text-brand mb-6 animate-pulse' />
        <h2 className='text-xl font-bold mb-2'>炉火未燃</h2>
        <p className='text-muted-foreground mb-6 text-sm font-semibold'>词库中还没有卡片，去添加一些关键字吧。</p>
        <div className='flex gap-3'>
          <Button variant="outline" onClick={() => navigate('/')}>返回首页</Button>
          <Button onClick={() => navigate('/browse')}>去浏览词库</Button>
        </div>
      </div>
    )
  }

  // ── Language Selection ──
  if (!selectedLanguage) {
    return (
      <div className='max-w-2xl mx-auto space-y-8 py-4 animate-in'>
        <div className='text-center space-y-3'>
          <div className='relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 dark:bg-brand/20 mb-2'>
            <Flame className='h-8 w-8 text-brand' />
          </div>
          <h1 className='text-2xl font-bold'>拼写练习</h1>
          <p className='text-sm text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed'>听音辨字，拼写练习。通过敲击键盘输入完整的关键字，校验与巩固拼写熟练度。</p>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          {Object.entries(LANGUAGES).filter(([key]) => (settings.selectedLanguages || []).includes(key)).map(([key, lang]) => {
            const count = langCounts[key]
            return (
              <button key={key} onClick={() => count > 0 && (setDifficulty('normal'), setSelectedLanguage(key), start(key))} disabled={count === 0}
                className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all duration-300 ${count > 0 ? `border-zinc-200 dark:border-zinc-800 ${lang.hover} hover:shadow-lg hover:-translate-y-0.5 cursor-pointer` : 'border-zinc-100 dark:border-zinc-900 opacity-50 cursor-not-allowed'}`}>
                <div className='flex items-start justify-between mb-4'>
                  <div className={`w-12 h-12 rounded-xl ${lang.bg} flex items-center justify-center shadow-inner`}><lang.icon className={`h-6 w-6 ${lang.color}`} /></div>
                  <Badge variant='secondary' className='text-xs font-mono font-bold'>{count} 个词</Badge>
                </div>
                <h3 className='text-lg font-bold mb-1'>{lang.label}</h3>
                {count > 0 && <div className={`absolute inset-0 ${lang.glow} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />}
              </button>
            )
          })}
        </div>
        <button onClick={() => (setDifficulty('normal'), setSelectedLanguage('all'), start('all'))}
          className='w-full group rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-brand p-5 flex items-center justify-center gap-3 transition-all cursor-pointer hover:shadow-md'>
          <Layers className='h-5 w-5 text-brand' />
          <span className='text-sm font-bold group-hover:text-brand transition-colors'>混合练习</span>
          <Badge variant='outline' className='text-[11px] font-mono font-bold'>{totalCount}</Badge>
        </button>
      </div>
    )
  }

  // ── Done ──
  if (done) {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
    const level = heat >= 80 ? '极佳' : heat >= 50 ? '良好' : heat >= 20 ? '中等' : '一般'
    return (
      <div className='max-w-2xl mx-auto space-y-6 animate-in'>
        <Card className='shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm'>
          <CardContent className='p-8 text-center space-y-6'>
            <div className='flex justify-center'>
              {accuracy >= 80 ? <Trophy className="h-16 w-16 text-state-learning" /> :
               accuracy >= 60 ? <ThumbsUp className="h-16 w-16 text-state-mastered" /> :
               <Activity className="h-16 w-16 text-state-learning" />}
            </div>
            <h2 className='text-2xl font-bold'>练习完成</h2>
            <div className='max-w-sm mx-auto bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm space-y-4'>
              <div className='grid grid-cols-4 gap-3'>
                <div className='text-center'><p className='text-2xl font-extrabold text-state-mastered font-mono'>{correctCount}</p><p className='text-[10px] text-muted-foreground mt-1 font-bold'>正确</p></div>
                <div className='text-center'><p className='text-2xl font-extrabold text-rating-again font-mono'>{questions.length - correctCount}</p><p className='text-[10px] text-muted-foreground mt-1 font-bold'>错误</p></div>
                <div className='text-center'><p className='text-2xl font-extrabold text-brand font-mono'>{maxStreak}</p><p className='text-[10px] text-muted-foreground mt-1 font-bold'>最高连击</p></div>
                <div className='text-center'><p className={`text-2xl font-extrabold font-mono ${accuracy >= 80 ? 'text-state-mastered' : accuracy >= 60 ? 'text-state-learning' : 'text-rating-again'}`}>{accuracy}%</p><p className='text-[10px] text-muted-foreground mt-1 font-bold'>正确率</p></div>
              </div>
              <Progress value={accuracy} className="h-1.5" />
            </div>
            <p className='text-muted-foreground text-xs font-semibold'>用时 {Math.floor(elapsed / 60)}分{elapsed % 60}秒 · 状态评估：{level}</p>
            {sessionStats.length > 0 && (
              <div className='text-left space-y-2'>
                <h3 className='text-sm font-bold'>练习清单</h3>
                <div className='bg-white dark:bg-zinc-900 border rounded-xl divide-y overflow-hidden max-h-60 overflow-y-auto shadow-inner'>
                  {sessionStats.map((item, idx) => (
                    <div key={idx} className='p-3 flex items-center justify-between text-sm hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors'>
                      <div className='flex items-center gap-2 min-w-0'>
                        {item.correct ? <CheckCircle className='h-4 w-4 text-state-mastered shrink-0' /> :
                         item.skipped ? <SkipForward className='h-4 w-4 text-state-learning shrink-0' /> :
                         <XCircle className='h-4 w-4 text-rating-again shrink-0' />}
                        <span className='font-mono font-bold text-brand truncate'>{item.keyword}</span>
                      </div>
                      {!item.correct && !item.skipped && <span className='text-xs text-muted-foreground font-medium'>输入: {item.input}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className='flex gap-3 justify-center pt-2'>
              <Button onClick={() => { setDifficulty(null); setSelectedLanguage(null); setStarted(false) }} className='bg-brand hover:bg-brand/90 text-white rounded-xl font-bold shadow-md shadow-brand/10'><RotateCcw className='h-4 w-4 mr-2' />再练一轮</Button>
              <Button variant='outline' onClick={() => navigate('/')} className='rounded-xl font-bold border-zinc-200 dark:border-zinc-800'>返回首页</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const langInfo = LANGUAGES[card.language]
  const showDefinition = difficulty !== 'hard'
  const showFirstLetter = difficulty === 'easy' && !answered
  const effectiveHintCount = showHint ? hintCount : (showFirstLetter && typed.length === 0 ? 1 : 0)

  return (
    <div className='max-w-xl mx-auto select-none animate-in' onClick={focusInput}>
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none w-1 h-1"
        value={typed}
        onChange={handleInputChange}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
      {/* Top: streak + heat + timer */}
      <div className='flex items-center justify-between mb-2 px-1'>
        <div className='flex items-center gap-3'>
          {streak > 0 && (
            <div className='flex items-center gap-1 text-brand font-bold text-sm animate-in'>
              <Flame className='h-4 w-4' /> {streak} 连击
            </div>
          )}
        </div>
        <div className='flex items-center gap-1.5'>
          {questions.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentQ ? 'bg-brand scale-150 shadow-sm' : i < currentQ ? 'bg-brand/60 dark:bg-brand/40' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
          ))}
        </div>
        <span className='text-xs text-muted-foreground font-mono font-bold'>⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
      </div>

      {/* Dynamic Heat Bar */}
      <div className='h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-6 overflow-hidden shadow-inner'>
        <div className={`h-full lava-flow rounded-full transition-all duration-500`} style={{ width: `${heat}%` }} />
      </div>

      {/* Main spelling sandbox card with dynamic forge glow border based on heat */}
      <Card className={`transition-all duration-500 bg-white dark:bg-zinc-950 border-2 ${getForgeGlowClass()} shadow-md mb-6`}>
        <CardContent className="p-6">
          
          {/* Audio Play Button */}
          <div className='flex justify-center mb-5'>
            <button 
              onClick={(e) => { e.stopPropagation(); playKeyword(card.keyword); }}
              className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 cursor-pointer group ${heat >= 50 ? 'bg-brand/10 dark:bg-brand/10 hover:bg-brand/20' : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800'} ${heat >= 80 ? 'shadow-md shadow-brand/20' : ''}`}
            >
              <Volume2 className={`h-7 w-7 transition-transform group-hover:scale-110 ${heat >= 50 ? 'text-brand animate-pulse' : 'text-zinc-500'}`} />
            </button>
          </div>

          {/* Language + Category */}
          <div className='flex items-center justify-center gap-2 mb-4'>
            {langInfo && <Badge variant='secondary' className='text-xs font-bold'><span className="flex items-center gap-1"><langInfo.icon className={`h-3 w-3 ${langInfo.color}`} /> {langInfo.label}</span></Badge>}
            <Badge variant='outline' className='text-xs font-bold'>{card.category}</Badge>
          </div>

          {/* Definition (hidden on hard mode) */}
          {showDefinition && (
            <div className='text-center mb-6 px-4'>
              <p className='text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider mb-1'>释义 Context</p>
              <p className='text-sm leading-relaxed text-foreground whitespace-pre-wrap max-w-md mx-auto font-semibold'>{card.definition}</p>
            </div>
          )}

          {/* Letter slots — underlines with pops */}
          <div className={`flex items-end justify-center gap-2.5 sm:gap-3.5 mb-6 flex-wrap px-2 transition-all ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
            {keyword.split('').map((letter, i) => {
              const isTyped = i < typed.length
              const isHinted = i < effectiveHintCount
              const isCurrentPos = i === typed.length && !answered
              const typedChar = isTyped ? typed[i] : ''
              const result = letterResults[i] || 'empty'

              let textColor = 'text-foreground'
              if (result === 'correct') textColor = 'text-state-mastered'
              else if (result === 'wrong') textColor = 'text-rating-again'
              else if (result === 'hint') textColor = 'text-state-learning'
              else if (!isTyped && !isHinted) textColor = 'text-zinc-300 dark:text-zinc-700'

              let lineColor = 'bg-zinc-200 dark:bg-zinc-800'
              if (result === 'correct') lineColor = 'bg-state-mastered'
              else if (result === 'wrong') lineColor = 'bg-rating-again'
              else if (result === 'hint') lineColor = 'bg-state-learning'
              else if (isCurrentPos) lineColor = 'bg-brand animate-pulse'

              return (
                <div key={i} className='flex flex-col items-center min-w-[18px] sm:min-w-[24px]'>
                  <span className={`h-8 sm:h-10 flex items-end justify-center font-mono text-lg sm:text-2xl font-bold transition-all duration-150 ${textColor} ${isTyped ? 'letter-slot-pop' : ''}`}>
                    {isTyped ? typedChar : isHinted ? letter : ''}
                  </span>
                  <div className={`w-full h-0.5 mt-1 rounded-full transition-all ${lineColor} ${isCurrentPos ? 'h-0.5' : ''}`} />
                </div>
              )
            })}
          </div>

          {/* Streak status overlay */}
          {streak >= 3 && !answered && (
            <div className='flex justify-center mb-1'>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand/10 dark:bg-brand/10 text-brand`}>
                <Flame className='h-3.5 w-3.5' />
                {heat >= 80 ? '连击状态极佳' : heat >= 50 ? '状态良好' : '已进入连击'}
              </div>
            </div>
          )}

          {/* Feedback */}
          {answered && (
            <div className='mt-4 text-center space-y-3 animate-in fade-in'>
              {isCorrect ? (
                <div className='flex items-center justify-center gap-2 text-state-mastered'>
                  <CheckCircle className='h-6 w-6' />
                  <span className='text-lg font-bold'>{streak >= 5 ? '连续正确！非常完美' : streak >= 3 ? '连续正确！' : '拼写正确。'}</span>
                </div>
              ) : (
                <div className="bg-rating-again/10 border border-rating-again/20 rounded-xl p-3 max-w-sm mx-auto">
                  <div className="flex items-center justify-center gap-1 text-rating-again mb-1">
                    <XCircle className='h-4 w-4 shrink-0' />
                    <span className='text-xs font-bold'>拼写有误，正确关键字：</span>
                  </div>
                  <p className='font-mono text-xl font-bold text-brand tracking-wider'>{keyword}</p>
                </div>
              )}
              {card.code_example && (
                <div className='bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-left max-w-md mx-auto'>
                  <pre className='text-xs font-mono overflow-x-auto whitespace-pre-wrap'><code className={`language-${langInfo?.prism || card.language}`}>{card.code_example}</code></pre>
                </div>
              )}
            </div>
          )}

          {/* Action */}
          {answered && (
            <div className='flex justify-center mt-5 animate-in fade-in'>
              <Button onClick={handleNext} className='bg-brand hover:bg-brand/90 text-white rounded-xl h-10 px-8 font-bold shadow-md shadow-brand/10 hover:scale-105 active:scale-95 transition-all'>
                {currentQ < questions.length - 1 ? '下一题' : '查看结果'} <ArrowRight className='h-4 w-4 ml-1.5' />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cyber Virtual Keyboard (Only shown when not answered yet) */}
      {!answered && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-1.5 shadow-sm max-w-lg mx-auto">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1.5">
              {row.map(char => {
                const isActive = lastPressedKey === char
                return (
                  <button
                    key={char}
                    onClick={(e) => { e.stopPropagation(); typeCharacter(char); }}
                    className={`h-9 w-8 sm:w-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-sm font-bold uppercase shadow-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 select-none active:scale-90 transition-all ${isActive ? 'key-press-active' : ''}`}
                  >
                    {char}
                  </button>
                )
              })}
              
              {/* Backspace & helper alignment inside rows */}
              {rIdx === 2 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCharacter(); }}
                  className="h-9 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 shadow-sm active:scale-90 transition-all flex items-center justify-center gap-1 text-muted-foreground select-none"
                  title="退格 (Backspace)"
                >
                  <Delete className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          
          {/* Virtual Keyboard bottom controller bar */}
          <div className="flex justify-center gap-3 pt-1 border-t border-zinc-200 dark:border-zinc-800/60 mt-1">
            <button 
              onClick={(e) => { e.stopPropagation(); if (!showHint) { setShowHint(true); setHintCount(1) } else if (hintCount < keyword.length) setHintCount(h => h + 1); }}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-[10px] text-state-learning cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <HelpCircle className="w-3.5 h-3.5" /> 提示 (↓)
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); completeWord(false, true); }}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-[10px] text-zinc-500 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <SkipForward className="w-3.5 h-3.5" /> 跳过 (→)
            </button>
          </div>
        </div>
      )}

      {/* Bottom shortcuts tips */}
      {!answered && (
        <div className='flex items-center justify-center gap-5 text-[10px] text-muted-foreground/80 font-bold pt-4'>
          <button onClick={() => playKeyword(card.keyword)} className='flex items-center gap-1 hover:text-foreground transition-colors'>
            <Volume2 className='h-3.5 w-3.5' /> 发音 <kbd className='kbd'>Shift+P</kbd>
          </button>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">可以直接通过您的物理键盘直接输入</span>
        </div>
      )}
    </div>
  )
}
