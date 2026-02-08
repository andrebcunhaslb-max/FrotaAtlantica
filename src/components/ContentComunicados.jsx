import { useState, useEffect, useRef } from 'react'
import { Send, Megaphone } from 'lucide-react'
import { useApp } from '../context/AppContext'

function formatChatTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export default function ContentComunicados() {
  const {
    user,
    comunicadosGlobais,
    loadComunicadosGlobais,
    sendComunicadosGlobais,
    setChatViewingState,
    isLight,
  } = useApp()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listEndRef = useRef(null)
  const isDirecao = (user?.cargo || '').toLowerCase() === 'direcao'

  useEffect(() => {
    loadComunicadosGlobais()
    setChatViewingState('comunicados')
  }, [loadComunicadosGlobais, setChatViewingState])

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9580856c-7f30-4bf9-a5d2-e0418a6e2a45',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentComunicados.jsx:scrollEffect',message:'scroll to end',data:{comunicadosLength:comunicadosGlobais?.length,hasListEndRef:!!listEndRef.current},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comunicadosGlobais])

  useEffect(() => {
    const id = setInterval(loadComunicadosGlobais, 8000)
    return () => clearInterval(id)
  }, [loadComunicadosGlobais])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !isDirecao) return
    setSending(true)
    try {
      await sendComunicadosGlobais(text)
      setInput('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="glass-card flex flex-col min-h-[320px] h-full">
      <h2 className="text-lg font-semibold mt-0 mb-3 px-5 pt-5 flex items-center gap-2">
        <Megaphone className="h-5 w-5 shrink-0" aria-hidden />
        Comunicados
      </h2>
      <div className="flex-1 overflow-y-auto px-5 space-y-3">
        {comunicadosGlobais.length === 0 && (
          <p className={`text-sm py-4 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
            {isDirecao ? 'Ainda não há comunicados. Publica o primeiro.' : 'Ainda não há comunicados globais.'}
          </p>
        )}
        {comunicadosGlobais.map((msg) => (
          <div key={msg.id} className="com-card group">
            <div className="flex items-center gap-2 flex-wrap">
              <Megaphone className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {msg.userName}
              </span>
              <span className={`text-xs ml-auto ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                {formatChatTime(msg.timestamp)}
              </span>
            </div>
            <p className={`text-sm mt-1 break-words ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {msg.text}
            </p>
          </div>
        ))}
        <div ref={listEndRef} />
      </div>
      {isDirecao ? (
        <form
          onSubmit={handleSubmit}
          className={`p-4 border-t flex gap-2 ${isLight ? 'border-slate-200' : 'border-slate-600'}`}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Publicar comunicado..."
            className="glass-input flex-1 min-w-0"
            maxLength={2000}
            disabled={sending}
            aria-label="Comunicado global"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn-primary inline-flex items-center gap-2 shrink-0"
            aria-label="Publicar"
          >
            <Megaphone className="h-4 w-4" />
            Publicar
          </button>
        </form>
      ) : (
        <p className={`p-4 border-t text-xs ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-600 text-slate-500'}`}>
          Apenas a direção pode publicar comunicados globais.
        </p>
      )}
    </div>
  )
}
