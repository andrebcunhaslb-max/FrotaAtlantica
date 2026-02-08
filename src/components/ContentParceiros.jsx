import { useState, useEffect, useRef } from 'react'
import { Send, Handshake } from 'lucide-react'
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

export default function ContentParceiros() {
  const {
    user,
    parceiros,
    loadParceiros,
    sendParceiros,
    setChatViewingState,
    isLight,
  } = useApp()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listEndRef = useRef(null)
  const isDirecao = (user?.cargo || '').toLowerCase() === 'direcao'

  useEffect(() => {
    loadParceiros()
    setChatViewingState('parceiros')
  }, [loadParceiros, setChatViewingState])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [parceiros])

  useEffect(() => {
    const id = setInterval(loadParceiros, 8000)
    return () => clearInterval(id)
  }, [loadParceiros])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !isDirecao) return
    setSending(true)
    try {
      await sendParceiros(text)
      setInput('')
    } finally {
      setSending(false)
    }
  }

  const msgClass = isLight
    ? 'rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-2.5'
    : 'rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2.5'

  return (
    <div className="glass-card flex flex-col min-h-[320px] h-full">
      <h2 className="text-lg font-semibold mt-0 mb-3 px-5 pt-5 flex items-center gap-2">
        <Handshake className="h-5 w-5 shrink-0" aria-hidden />
        Parceiros
      </h2>
      <div className="flex-1 overflow-y-auto px-5 space-y-3">
        {parceiros.length === 0 && (
          <p className={`text-sm py-4 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
            {isDirecao ? 'Ainda não há mensagens. Publica a primeira.' : 'Ainda não há mensagens em Parceiros.'}
          </p>
        )}
        {parceiros.map((msg) => (
          <div key={msg.id} className={msgClass}>
            <div className="flex items-center gap-2 flex-wrap">
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
            placeholder="Publicar mensagem para parceiros..."
            className="glass-input flex-1 min-w-0"
            maxLength={2000}
            disabled={sending}
            aria-label="Mensagem Parceiros"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn-primary inline-flex items-center gap-2 shrink-0"
            aria-label="Publicar"
          >
            <Send className="h-4 w-4" />
            Publicar
          </button>
        </form>
      ) : (
        <p className={`p-4 border-t text-xs ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-600 text-slate-500'}`}>
          Apenas a direção pode publicar aqui.
        </p>
      )}
    </div>
  )
}
