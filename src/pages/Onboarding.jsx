import React, { useState } from 'react'
import LANGUAGES from '../languages'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ChevronRight } from 'lucide-react'

export default function Onboarding({ onComplete }) {
  const [selected, setSelected] = useState([])

  const toggle = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-in">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">你想学什么？</h1>
          <p className="text-sm text-muted-foreground">选一门或几门，后面随时可以加。</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(LANGUAGES).map(([key, lang]) => {
            const isSelected = selected.includes(key)
            return (
              <button key={key} onClick={() => toggle(key)}
                className={`relative p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${lang.bg} flex items-center justify-center`}>
                    <lang.icon className={`h-5 w-5 ${lang.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{lang.label}</h3>
                    <p className="text-xs text-muted-foreground">{lang.desc}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                      <svg className="w-3 h-3 text-brand-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => onComplete(selected)}
            disabled={selected.length === 0}
            className="w-full h-11 rounded-xl font-semibold bg-brand hover:bg-brand/90 text-brand-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开始学习 {selected.length > 0 && `(${selected.length} 门)`}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {selected.length === 0 && (
            <p className="text-xs text-muted-foreground">至少选一门语言</p>
          )}
        </div>
      </div>
    </div>
  )
}
