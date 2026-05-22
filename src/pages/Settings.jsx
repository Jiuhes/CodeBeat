import React, { useState, useRef } from 'react'
import db from '../db'
import LANGUAGES from '../languages'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Slider } from '../components/ui/slider'
import { Sun, Moon, Monitor, Download, Upload, Trash2, Check, Settings as SettingsIcon, Palette, BarChart3, Database, BookOpen } from 'lucide-react'

export default function Settings({ settings, onUpdate }) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [message, setMessage] = useState('')
  const fileRef = useRef()

  const handleChange = async (key, value) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    await onUpdate(newSettings)
  }

  const handleExport = async () => {
    try {
      const data = await db.exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `codebeat-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('导出成功！')
      setTimeout(() => setMessage(''), 3000)
    } catch (e) {
      setMessage('导出失败: ' + e.message)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      await db.importData(text)
      setMessage('导入成功！')
      setTimeout(() => { setMessage(''); window.location.reload() }, 1500)
    } catch (e) {
      setMessage('导入失败：文件格式错误')
    }
    e.target.value = ''
  }

  const handleClear = async () => {
    if (!confirm('确定要清除所有学习数据吗？此操作不可恢复。')) return
    await db.clearAll()
    setMessage('数据已清除')
    setTimeout(() => window.location.reload(), 1000)
  }

  const themes = [
    { value: 'light', label: '极简白', icon: Sun, desc: '经典明亮质感' },
    { value: 'dark', label: '黑曜碳素', icon: Moon, desc: '琥珀青铜 · 低调专业' },
    { value: 'dark-indigo', label: '深空煤炭', icon: Moon, desc: '极客靛蓝 · 科技格调' },
    { value: 'dark-moss', label: '茶珀碳黑', icon: Moon, desc: '森林墨绿 · 护眼人文' },
    { value: 'auto', label: '跟随系统', icon: Monitor, desc: '自动切换' },
  ]

  return (
    <div className='max-w-2xl mx-auto space-y-6 animate-in'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'><SettingsIcon className="h-6 w-6 inline mr-2 text-brand" />设置</h1>
        <p className='text-muted-foreground mt-1'>个性化你的学习体验</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${message.includes('成功') ? 'bg-state-mastered/10 text-state-mastered border border-state-mastered/20' : 'bg-rating-again/10 text-rating-again border border-rating-again/20'}`}>
          {message.includes('成功') ? <Check className='h-4 w-4' /> : null}
          {message}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className='text-base flex items-center'><Palette className="h-4 w-4 mr-2 text-brand" /> 主题</CardTitle></CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
            {themes.map(t => (
              <button key={t.value} onClick={() => handleChange('theme', t.value)}
                className={`p-3 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-between cursor-pointer ${localSettings.theme === t.value ? 'border-brand bg-brand/10 text-brand' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}>
                <t.icon className={`h-5 w-5 mb-2 ${localSettings.theme === t.value ? 'text-brand' : 'text-muted-foreground'}`} />
                <p className='font-bold text-sm tracking-tight'>{t.label}</p>
                <p className='text-[10px] text-muted-foreground mt-1 leading-normal'>{t.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className='text-base flex items-center'><BookOpen className="h-4 w-4 mr-2 text-brand" /> 学习语言</CardTitle></CardHeader>
        <CardContent>
          <p className='text-xs text-muted-foreground mb-3'>选择你要学习的语言，取消后已学数据不会丢失。</p>
          <div className='grid grid-cols-2 gap-2'>
            {Object.entries(LANGUAGES).map(([key, lang]) => {
              const selected = (localSettings.selectedLanguages || []).includes(key)
              return (
                <button key={key} onClick={() => {
                  const current = localSettings.selectedLanguages || []
                  const next = selected ? current.filter(k => k !== key) : [...current, key]
                  handleChange('selectedLanguages', next)
                }}
                  className={`p-3 rounded-lg border-2 transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                    selected ? 'border-brand bg-brand/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}>
                  <lang.icon className={`h-4 w-4 ${lang.color}`} />
                  <span className='text-sm font-medium'>{lang.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className='text-base flex items-center'><BarChart3 className="h-4 w-4 mr-2 text-brand" /> 每日学习限制</CardTitle></CardHeader>
        <CardContent className='space-y-6'>
          <div>
            <div className='flex justify-between mb-2'>
              <label className='text-sm text-muted-foreground'>每日新学卡片上限</label>
              <Badge variant='secondary'>{localSettings.dailyNewCards}</Badge>
            </div>
            <Slider min={1} max={50} value={localSettings.dailyNewCards} onChange={(e) => handleChange('dailyNewCards', parseInt(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className='text-base flex items-center'><Database className="h-4 w-4 mr-2 text-brand" /> 数据管理</CardTitle></CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-3'>
            <Button onClick={handleExport} variant='outline'><Download className='h-4 w-4 mr-2' />导出数据</Button>
            <Button onClick={() => fileRef.current?.click()} variant='outline'><Upload className='h-4 w-4 mr-2' />导入数据</Button>
            <input ref={fileRef} type='file' accept='.json' onChange={handleImport} style={{ display: 'none' }} />
            <Button onClick={handleClear} variant='destructive' className='ml-auto'><Trash2 className='h-4 w-4 mr-2' />清除所有数据</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-sm text-muted-foreground'>
            <p className='font-semibold text-foreground'>CodeBeat — 编程关键词记忆节拍</p>
            <p className='mt-1'>通过测验、拼写与对照，高效掌握编程语言核心关键字。</p>
            <p className='mt-1'>技术栈：React + Vite + Tailwind CSS + shadcn/ui + SQLite WebAssembly</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
