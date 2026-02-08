import { Megaphone } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ComunicadoGeralAlert() {
  const {
    hasUnreadComunicadosGlobais,
    setActiveTab,
    setChatViewingState,
    isLight,
  } = useApp()

  if (!hasUnreadComunicadosGlobais) return null

  const handleVerComunicados = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9580856c-7f30-4bf9-a5d2-e0418a6e2a45',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ComunicadoGeralAlert.jsx:handleVerComunicados',message:'banner Ver comunicados clicked',data:{callingSetActiveTabChat:true,callingSetChatViewingStateComunicados:true},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    setActiveTab('chat')
    setChatViewingState('comunicados')
  }

  const base = isLight
    ? 'bg-amber-50 border-amber-300 text-amber-900'
    : 'bg-amber-900/30 border-amber-500/60 text-amber-100'

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 shrink-0 ${base}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Megaphone className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
        <p className="text-sm font-medium">
          Tem um novo comunicado geral.
        </p>
      </div>
      <button
        type="button"
        onClick={handleVerComunicados}
        className="btn-primary text-sm py-2 px-3 sm:px-4 shrink-0"
        aria-label="Ver comunicados"
      >
        Ver comunicados
      </button>
    </div>
  )
}
