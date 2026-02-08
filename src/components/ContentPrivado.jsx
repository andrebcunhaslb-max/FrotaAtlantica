import { useState, useEffect, useRef } from 'react'
import { Send, User } from 'lucide-react'
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

export default function ContentPrivado() {
  const {
    user,
    usuarios,
    chatPrivado,
    loadChatPrivado,
    sendChatPrivado,
    setChatViewingState,
    isLight,
  } = useApp()
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listEndRef = useRef(null)

  const otherUsers = (usuarios || []).filter((u) => u && String(u.id) !== String(user?.id))

  useEffect(() => {
    if (selectedUserId) {
      loadChatPrivado(selectedUserId)
      setChatViewingState('privado', selectedUserId)
    }
  }, [selectedUserId, loadChatPrivado, setChatViewingState])

  useEffect(() => {
    if (!selectedUserId) return
    const id = setInterval(() => loadChatPrivado(selectedUserId), 8000)
    return () => clearInterval(id)
  }, [selectedUserId, loadChatPrivado])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatPrivado])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !selectedUserId) return
    setSending(true)
    try {
      await sendChatPrivado(selectedUserId, text)
      setInput('')
    } finally {
      setSending(false)
    }
  }

  const selectedUser = otherUsers.find((u) => String(u.id) === String(selectedUserId))

  return (
    <div className="glass-card flex flex-col min-h-[320px] h-full">
      <h2 className="text-lg font-semibold mt-0 mb-3 px-5 pt-5">Mensagens privadas</h2>
      <div className={`px-5 mb-3 ${isLight ? 'border-slate-200' : 'border-slate-600'}`}>
        <label className={`flex items-center gap-2 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <User className="h-4 w-4 shrink-0" />
          Conversar com
        </label>
        <select
          value={selectedUserId ?? ''}
          onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
          className={`glass-input mt-1 w-full max-w-[280px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
          aria-label="Escolher destinatário"
        >
          <option value="">— Escolher pessoa —</option>
          {otherUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome || `Utilizador ${u.id}`}
            </option>
          ))}
        </select>
      </div>
      {!selectedUserId ? (
        <p className={`flex-1 px-5 text-sm ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
          Escolhe um destinatário para ver e enviar mensagens privadas.
        </p>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 space-y-3">
            {chatPrivado.length === 0 && (
              <p className={`text-sm py-4 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                Ainda não há mensagens com {selectedUser?.nome}. Envia a primeira.
              </p>
            )}
            {chatPrivado.map((msg) => {
              const isFromMe = String(msg.fromUserId) === String(user?.id)
              return (
                <div
                  key={msg.id}
                  className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`${isFromMe ? 'msg-card msg-card-mine' : 'msg-card'} max-w-[85%]`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {msg.userName}
                      </span>
                      <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                        {formatChatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 break-words ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={listEndRef} />
          </div>
          <form
            onSubmit={handleSubmit}
            className={`p-4 border-t flex gap-2 ${isLight ? 'border-slate-200' : 'border-slate-600'}`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreve uma mensagem..."
              className="glass-input flex-1 min-w-0"
              maxLength={2000}
              disabled={sending}
              aria-label="Mensagem privada"
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
        </>
      )}
    </div>
  )
}
