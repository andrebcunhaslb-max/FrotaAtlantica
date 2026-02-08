import { useState, useEffect, useRef, useMemo } from 'react'
import { Send, MessageCircle, Megaphone, Trash2 } from 'lucide-react'
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
    usuarios,
    chatEquipa,
    comunicadosEquipa,
    loadChatEquipa,
    sendChatEquipa,
    loadComunicados,
    sendComunicado,
    deleteChatMessageEquipa,
    deleteComunicado,
    markComunicadosAsSeen,
    hasUnreadComunicados,
    showConfirm,
    activeEquipaGrupo,
    setActiveEquipaGrupo,
    isLight,
  } = useApp()
  const cargo = (user?.cargo || '').toLowerCase()
  const isDirecaoGestor = cargo === 'direcao' || cargo === 'gestor'
  const isSupervisor = cargo === 'supervisor'
  const canModerate = isSupervisor || isDirecaoGestor
  const canPublishComunicados = canModerate

  const equipasDisponiveis = useMemo(() => {
    const grupos = [...new Set((usuarios || []).map((u) => (u.grupo || '').trim()).filter(Boolean))]
    return grupos.sort()
  }, [usuarios])
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

  const handleDeleteChat = (msg) => {
    showConfirm({
      title: 'Apagar mensagem',
      message: 'Tens a certeza que queres apagar esta mensagem?',
      variant: 'danger',
      confirmLabel: 'Apagar',
      onConfirm: () => deleteChatMessageEquipa(grupo, msg.id),
    })
  }

  const handleDeleteComunicado = (msg) => {
    showConfirm({
      title: 'Apagar comunicado',
      message: 'Tens a certeza que queres apagar este comunicado?',
      variant: 'danger',
      confirmLabel: 'Apagar',
      onConfirm: () => deleteComunicado(grupo, msg.id),
    })
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

  const needsTeamSelection = !grupo && isDirecaoGestor && equipasDisponiveis.length > 0

  if (needsTeamSelection) {
    return (
      <div className="glass-card flex flex-col min-h-[320px] h-full">
        <h2 className="text-lg font-semibold mt-0 mb-4 px-5 pt-5">Equipa</h2>
        <p className={`px-5 text-sm mb-4 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
          Escolhe a equipa cujo chat e comunicados queres ver:
        </p>
        <div className="px-5">
          <select
            value={activeEquipaGrupo || ''}
            onChange={(e) => setActiveEquipaGrupo(e.target.value || null)}
            className={`glass-input max-w-[200px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
            aria-label="Selecionar equipa"
          >
            <option value="">— Escolher equipa —</option>
            {equipasDisponiveis.map((g) => (
              <option key={g} value={g}>
                Equipa {g}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  if (!grupo) return null

  return (
    <div className="glass-card flex flex-col min-h-[320px] h-full">
      <div className="flex flex-wrap items-center gap-3 mt-0 mb-3 px-5 pt-5">
        <h2 className="text-lg font-semibold">Equipa {grupo}</h2>
        {isDirecaoGestor && equipasDisponiveis.length > 1 && (
          <select
            value={grupo}
            onChange={(e) => setActiveEquipaGrupo(e.target.value || null)}
            className={`glass-input text-sm py-1.5 px-3 max-w-[140px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
            aria-label="Mudar equipa"
          >
            {equipasDisponiveis.map((g) => (
              <option key={g} value={g}>
                Equipa {g}
              </option>
            ))}
          </select>
        )}
      </div>
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
              <div key={msg.id} className="msg-card group">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{msg.userName}</span>
                  {msg.cargo && (
                    <span className={isLight ? 'text-xs rounded-full bg-slate-200 px-2 py-0.5 text-slate-600' : 'text-xs rounded-full bg-slate-600/80 px-2 py-0.5 text-slate-400'}>
                      {msg.cargo}
                    </span>
                  )}
                  <span className={`text-xs ml-auto ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>{formatChatTime(msg.timestamp)}</span>
                  {canModerate && (
                    <button
                      type="button"
                      onClick={() => handleDeleteChat(msg)}
                      className={`p-1 rounded opacity-70 hover:opacity-100 transition ${isLight ? 'text-slate-500 hover:text-red-600' : 'text-slate-400 hover:text-red-400'}`}
                      aria-label="Apagar mensagem"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
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
              <div key={msg.id} className="com-card group">
                <div className="flex items-center gap-2 flex-wrap">
                  <Megaphone className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{msg.userName}</span>
                  <span className={`text-xs ml-auto ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>{formatChatTime(msg.timestamp)}</span>
                  {canModerate && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComunicado(msg)}
                      className={`p-1 rounded opacity-70 hover:opacity-100 transition ${isLight ? 'text-slate-500 hover:text-red-600' : 'text-slate-400 hover:text-red-400'}`}
                      aria-label="Apagar comunicado"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
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
              Apenas supervisores da equipa ou direção/gestores podem publicar comunicados.
            </p>
          )}
        </>
      )}
    </div>
  )
}
