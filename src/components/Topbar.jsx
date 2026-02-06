import { useState, useEffect } from 'react'
import { Moon, Sun, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Topbar() {
  const { user, isLight, setIsLight } = useApp()
  const [time, setTime] = useState('00:00')
  const headerClass = isLight
    ? 'grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-6 py-3 shrink-0 border-b border-slate-200 bg-white/70 backdrop-blur-sm'
    : 'grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-6 py-3 shrink-0 border-b border-slate-600/60 bg-slate-900/50 backdrop-blur-sm'

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className={headerClass}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsLight(!isLight)}
          className="btn-primary inline-flex items-center gap-1.5 text-sm"
          aria-label={isLight ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
        >
          {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {isLight ? 'Escuro' : 'Claro'}
        </button>
      </div>
      <div className="flex items-center justify-center gap-2 text-xl font-semibold tracking-wider">
        <Clock className={`h-5 w-5 ${isLight ? 'text-slate-600' : 'text-slate-500'}`} aria-hidden />
        <span id="horaAtual">{time}</span>
      </div>
      <div className="flex justify-end items-center">
        <span
          className={
            isLight
              ? 'rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm text-slate-600'
              : 'rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-400'
          }
        >
          {user?.nome} ({user?.cargo})
        </span>
      </div>
    </header>
  )
}
