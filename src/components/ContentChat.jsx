import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
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

export default function ContentChat() {
  const { chatMessages, loadChat, sendChatMessage, isLight } = useApp()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listEndRef = useRef(null)

  useEffect(() => {
    loadChat()
  }, [loadChat])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    const id = setInterval(loadChat, 8000)
    return () => clearInterval(id)
  }, [loadChat])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await sendChatMessage(text)
      setInput('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="glass-card flex flex-col min-h-[320px] h-full">
      <h2 className="text-lg font-semibold mt-0 mb-3 px-5 pt-5">Chat geral</h2>
      <div className="flex-1 overflow-y-auto px-5 space-y-3">
        {chatMessages.length === 0 && (
          <p className={`text-sm py-4 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>Ainda não há mensagens. Envia a primeira.</p>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={isLight ? 'rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-2.5' : 'rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2.5'}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{msg.userName}</span>
              {msg.cargo && (
                <span className={isLight ? 'text-xs rounded-full bg-slate-200 px-2 py-0.5 text-slate-600' : 'text-xs rounded-full bg-slate-600/80 px-2 py-0.5 text-slate-400'}>
                  {msg.cargo}
                </span>
              )}
              <span className={`text-xs ml-auto ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>{formatChatTime(msg.timestamp)}</span>
            </div>
            <p className={`text-sm mt-1 break-words ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{msg.text}</p>
          </div>
        ))}
        <div ref={listEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={`p-4 border-t flex gap-2 ${isLight ? 'border-slate-200' : 'border-slate-600'}`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreve uma mensagem..."
          className="glass-input flex-1 min-w-0"
          maxLength={2000}
          disabled={sending}
          aria-label="Mensagem"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="btn-primary inline-flex items-center gap-2 shrink-0"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
          Enviar
        </button>
      </form>
    </div>
  )
}
