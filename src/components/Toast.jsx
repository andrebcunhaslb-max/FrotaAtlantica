import { useEffect } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toast, setToast, isLight } = useApp()

  useEffect(() => {
    if (!toast.show) return
    const t = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }))
    }, 2500)
    return () => clearTimeout(t)
  }, [toast.show, setToast])

  if (!toast.show) return null

  const isError = toast.type === 'error'
  const containerClass = isLight
    ? isError
      ? 'border-red-300 bg-white/95 text-slate-800 backdrop-blur-xl'
      : 'border-slate-200 bg-white/95 text-slate-800 backdrop-blur-xl'
    : isError
      ? 'border-red-500/50 bg-slate-900/95 text-slate-200 backdrop-blur-xl'
      : 'border-emerald-500/50 bg-slate-900/95 text-slate-200 backdrop-blur-xl'
  return (
    <div
      role="alert"
      className={`fixed right-6 bottom-6 z-50 flex min-w-[220px] max-w-xs items-center gap-2 rounded-xl border px-4 py-3 shadow-xl ${containerClass}`}
    >
      {isError ? (
        <AlertCircle className={`h-5 w-5 shrink-0 ${isLight ? 'text-red-500' : 'text-red-400'}`} aria-hidden />
      ) : (
        <CheckCircle className={`h-5 w-5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} aria-hidden />
      )}
      <span className="flex-1 text-sm">{toast.message}</span>
    </div>
  )
}
