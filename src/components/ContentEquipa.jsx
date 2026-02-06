import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Megaphone } from 'lucide-react'
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

export default function ContentEquipa({ grupo }) {
  const {
    user,
    chatEquipa,
    comunicadosEquipa,
    loadChatEquipa,
    sendChatEquipa,
    loadComunicados,
    sendComunicado,
    markComunicadosAsSeen,
    hasUnreadComunicados,
    isLight,
  } = useApp()
  const canPublishComunicados = (user?.cargo || '').toLowerCase() === 'supervisor'
  const [subtab, setSubtab] = useState('chat')
  const [chatInput, setChatInput] = useState('')
  const [comInput, setComInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)
  const [sendingCom, setSendingCom] = useState(false)
  const listEndRef = useRef(null)

  useEffect(() => {
    if (grupo) {
      loadChatEquipa(grupo)
      loadComunicados(grupo)
    }
  }, [grupo, loadChatEquipa, loadComunicados])

  useEffect(() => {
    if (subtab === 'comunicados' && grupo) {
      markComunicadosAsSeen(grupo, comunicadosEquipa)
    }
  }, [subtab, grupo, comunicadosEquipa, markComunicadosAsSeen])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [subtab === 'chat' ? chatEquipa : comunicadosEquipa])

  useEffect(() => {
    if (!grupo) return
    const id = setInterval(() => {
      loadChatEquipa(grupo)
      loadComunicados(grupo)
    }, 8000)
    return () => clearInterval(id)
  }, [grupo, loadChatEquipa, loadComunicados])

  const handleSubmitChat = async (e) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || sendingChat || !grupo) return
    setSendingChat(true)
    try {
      await sendChatEquipa(grupo, text)
      setChatInput('')
    } finally {
      setSendingChat(false)
    }
  }

  const handleSubmitComunicado = async (e) => {
    e.preventDefault()
    const text = comInput.trim()
    if (!text || sendingCom || !grupo) return
    setSendingCom(true)
    try {
      await sendComunicado(grupo, text)
      setComInput('')
    } finally {
      setSendingCom(false)
    }
  }

  if (!grupo) return null

  const msgClass = isLight
    ? 'rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-2.5'
    : 'rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2.5'
  const comClass = isLight
    ? 'rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-2.5'
    : 'rounded-xl border border-amber-500/50 bg-amber-500/15 px-4 py-2.5'

  return (
    <div className="glass-card flex flex-col min-h-[320px] h-full">
      <h2 className="text-lg font-semibold mt-0 mb-3 px-5 pt-5">Equipa {grupo}</h2>
      <div className="flex gap-2 mb-4 px-5">
        <button
          type="button"
          onClick={() => setSubtab('chat')}
          className={`pill flex items-center gap-2 ${subtab === 'chat' ? 'pill-active' : ''}`}
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => {
            setSubtab('comunicados')
            markComunicadosAsSeen(grupo, comunicadosEquipa)
          }}
          className={`pill flex items-center gap-2 relative ${subtab === 'comunicados' ? 'pill-active' : ''}`}
        >
          <Megaphone className="h-4 w-4" />
          Comunicados
          {subtab !== 'comunicados' && hasUnreadComunicados(grupo) && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" aria-label="Novo comunicado" />
          )}
        </button>
      </div>

      {subtab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto px-5 space-y-3">
            {chatEquipa.length === 0 && (
              <p className={`text-sm py-4 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                Ainda não há mensagens no chat da equipa. Envia a primeira.
              </p>
            )}
            {chatEquipa.map((msg) => (
              <div key={msg.id} className={msgClass}>
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
          <form onSubmit={handleSubmitChat} className={`p-4 border-t flex gap-2 ${isLight ? 'border-slate-200' : 'border-slate-600'}`}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escreve uma mensagem..."
              className="glass-input flex-1 min-w-0"
              maxLength={2000}
              disabled={sendingChat}
              aria-label="Mensagem chat"
            />
            <button type="submit" disabled={sendingChat || !chatInput.trim()} className="btn-primary inline-flex items-center gap-2 shrink-0" aria-label="Enviar">
              <Send className="h-4 w-4" />
              Enviar
            </button>
          </form>
        </>
      )}

      {subtab === 'comunicados' && (
        <>
          <div className="flex-1 overflow-y-auto px-5 space-y-3">
            {comunicadosEquipa.length === 0 && (
              <p className={`text-sm py-4 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                {canPublishComunicados ? 'Ainda não há comunicados. Publica o primeiro.' : 'Ainda não há comunicados.'}
              </p>
            )}
            {comunicadosEquipa.map((msg) => (
              <div key={msg.id} className={comClass}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Megaphone className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{msg.userName}</span>
                  <span className={`text-xs ml-auto ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>{formatChatTime(msg.timestamp)}</span>
                </div>
                <p className={`text-sm mt-1 break-words ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{msg.text}</p>
              </div>
            ))}
            <div ref={listEndRef} />
          </div>
          {canPublishComunicados ? (
            <form onSubmit={handleSubmitComunicado} className={`p-4 border-t flex gap-2 ${isLight ? 'border-slate-200' : 'border-slate-600'}`}>
              <input
                type="text"
                value={comInput}
                onChange={(e) => setComInput(e.target.value)}
                placeholder="Publicar comunicado..."
                className="glass-input flex-1 min-w-0"
                maxLength={2000}
                disabled={sendingCom}
                aria-label="Comunicado"
              />
              <button type="submit" disabled={sendingCom || !comInput.trim()} className="btn-primary inline-flex items-center gap-2 shrink-0" aria-label="Publicar">
                <Megaphone className="h-4 w-4" />
                Publicar
              </button>
            </form>
          ) : (
            <p className={`p-4 border-t text-xs ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-600 text-slate-500'}`}>
              Apenas supervisores podem publicar comunicados.
            </p>
          )}
        </>
      )}
    </div>
  )
}
