import React, { useState } from 'react'
import db from '../db'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Flame, User, Lock, Eye, EyeOff, CheckCircle, LogIn, UserPlus } from 'lucide-react'

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!username.trim() || !password.trim()) {
      setError('用户名和密码不能为空')
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        const user = await db.login(username, password)
        setSuccess('登录成功')
        setTimeout(() => onAuthSuccess(user), 800)
      } else {
        await db.register(username, password, 'flame')
        const user = await db.login(username, password)
        setSuccess('注册成功，正在登录...')
        setTimeout(() => onAuthSuccess(user), 800)
      }
    } catch (err) {
      setError(err.message || '操作失败')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-in">
      <Card className="w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-lg">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">
            {isLogin ? '登录' : '注册'} CodeBeat
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 mb-5 rounded-lg bg-zinc-100 dark:bg-zinc-900">
            <button onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              className={`py-1.5 rounded-md text-sm font-medium transition-all ${isLogin ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-muted-foreground'}`}>
              <LogIn className="h-3.5 w-3.5 inline mr-1" /> 登录
            </button>
            <button onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              className={`py-1.5 rounded-md text-sm font-medium transition-all ${!isLogin ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-muted-foreground'}`}>
              <UserPlus className="h-3.5 w-3.5 inline mr-1" /> 注册
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5" /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入用户名"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading}
              className="w-full py-2.5 h-11 mt-2 rounded-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white cursor-pointer">
              {loading ? '请稍候...' : isLogin ? '登录' : '注册'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
