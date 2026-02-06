import { useState, useEffect } from 'react'
import { Moon, Sun, Clock, Menu } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Topbar() {
  const { user, isLight, setIsLight, setSidebarOpen } = useApp()
  const [time, setTime] = useState('00:00')
  const baseBorder = isLight
    ? 'border-b border-slate-200 bg-white/70 backdrop-blur-sm'
    : 'border-b border-slate-600/60 bg-slate-900/50 backdrop-blur-sm'

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
    <header className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-2 md:px-6 md:py-3 shrink-0 min-h-[44px] ${baseBorder}`}>
      <div className="flex items-center gap-2 min-h-[44px]">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setIsLight(!isLight)}
          className="btn-primary inline-flex items-center gap-1.5 text-sm min-h-[44px] min-w-[44px] sm:min-w-0 sm:px-4 justify-center sm:justify-start"
          aria-label={isLight ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
        >
          {isLight ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />}
          <span className="hidden sm:inline">{isLight ? 'Escuro' : 'Claro'}</span>
        </button>
      </div>
      <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-semibold tracking-wider order-first w-full md:order-none md:w-auto">
        <Clock className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${isLight ? 'text-slate-600' : 'text-slate-500'}`} aria-hidden />
        <span id="horaAtual">{time}</span>
      </div>
      <div className="flex justify-end items-center min-h-[44px]">
        <span
          className={`max-w-[120px] sm:max-w-none truncate rounded-full border px-2 py-1.5 sm:px-3 text-sm ${
            isLight
              ? 'border-slate-300 bg-slate-100 text-slate-600'
              : 'border-slate-600 bg-slate-900/70 text-slate-400'
          }`}
          title={`${user?.nome} (${user?.cargo})`}
        >
          {user?.nome} ({user?.cargo})
        </span>
      </div>
    </header>
  )
}
