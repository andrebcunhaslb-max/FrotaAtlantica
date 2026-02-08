import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import ContentChat from './ContentChat'
import ContentEquipa from './ContentEquipa'
import ContentPrivado from './ContentPrivado'
import ContentParceiros from './ContentParceiros'
import ContentComunicados from './ContentComunicados'

export default function ContentChatUnified() {
  const {
    user,
    activeEquipaGrupo,
    isLight,
    setChatViewingState,
    hasUnreadChatGeral,
    hasUnreadChatEquipa,
    hasUnreadChatPrivado,
    hasUnreadParceiros,
    hasUnreadComunicadosGlobais,
  } = useApp()
  const userGrupo = (user?.grupo || '').trim()
  const isDirecaoGestor = user?.cargo === 'direcao' || user?.cargo === 'gestor'
  const showEquipa = userGrupo || isDirecaoGestor
  const grupo = activeEquipaGrupo || user?.grupo
  const [activeTab, setActiveTab] = useState('geral')

  useEffect(() => {
    const state = activeTab
    if (state === 'equipa' && grupo) {
      setChatViewingState('equipa', grupo)
    } else if (state === 'geral') {
      setChatViewingState('geral')
    } else if (state === 'parceiros') {
      setChatViewingState('parceiros')
    } else if (state === 'comunicados') {
      setChatViewingState('comunicados')
    } else if (state === 'privado') {
      setChatViewingState('privado')
    }
  }, [activeTab, grupo, setChatViewingState])
  useEffect(() => () => setChatViewingState(null), [setChatViewingState])

  const tabBorder = isLight ? 'border-slate-200' : 'border-slate-600'
  const tabActiveBg = isLight ? 'bg-white border-sky-500/50' : 'bg-slate-900/80 border-sky-500/40'
  const tabInactiveBg = isLight ? 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400'
  const tabActiveText = isLight ? 'text-sky-700 font-semibold' : 'text-sky-300 font-semibold'

  const tabClass = (isActive) =>
    `relative px-4 py-3 min-h-[44px] transition shrink-0 ${
      isActive ? `${tabActiveBg} border border-sky-500/40 shadow-sm ${tabActiveText}` : `border border-transparent ${tabInactiveBg}`
    }`

  const renderPanel = () => {
    switch (activeTab) {
      case 'geral':
        return <ContentChat />
      case 'equipa':
        return <ContentEquipa grupo={grupo} />
      case 'privado':
        return <ContentPrivado />
      case 'parceiros':
        return <ContentParceiros />
      case 'comunicados':
        return <ContentComunicados />
      default:
        return <ContentChat />
    }
  }

  const panelId = `chat-${activeTab}-panel`
  const tabId = (t) => `tab-${t}`

  return (
    <div className="flex flex-col min-h-[320px] h-full overflow-hidden">
      <div
        className={`flex shrink-0 rounded-t-xl overflow-x-auto overflow-y-hidden border ${tabBorder} ${isLight ? 'bg-slate-100/90' : 'bg-slate-800/50'}`}
        role="tablist"
        aria-label="Chat: Geral, Equipa, Privado, Parceiros, Comunicados"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'geral'}
          aria-controls="chat-geral-panel"
          id={tabId('geral')}
          onClick={() => {
            setActiveTab('geral')
            setChatViewingState('geral')
          }}
          className={`${tabClass(activeTab === 'geral')} rounded-tl-xl`}
        >
          Geral
          {hasUnreadChatGeral && (
            <span className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 animate-pulse ${isLight ? 'ring-slate-100' : 'ring-slate-800'}`} aria-label="Novas mensagens no chat geral" />
          )}
        </button>
        {showEquipa && (
          <>
            <div className={`w-px shrink-0 self-stretch my-2 ${tabBorder}`} aria-hidden />
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'equipa'}
              aria-controls="chat-equipa-panel"
              id={tabId('equipa')}
              onClick={() => {
                setActiveTab('equipa')
                setChatViewingState('equipa', grupo)
              }}
              className={tabClass(activeTab === 'equipa')}
            >
              Equipa
              {hasUnreadChatEquipa && (
                <span className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 animate-pulse ${isLight ? 'ring-slate-100' : 'ring-slate-800'}`} aria-label="Novas mensagens no chat da equipa" />
              )}
            </button>
          </>
        )}
        <div className={`w-px shrink-0 self-stretch my-2 ${tabBorder}`} aria-hidden />
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'privado'}
          aria-controls="chat-privado-panel"
          id={tabId('privado')}
          onClick={() => {
            setActiveTab('privado')
            setChatViewingState('privado')
          }}
          className={tabClass(activeTab === 'privado')}
        >
          Privado
          {hasUnreadChatPrivado && (
            <span className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-violet-500 ring-2 animate-pulse ${isLight ? 'ring-slate-100' : 'ring-slate-800'}`} aria-label="Mensagens privadas por ler" />
          )}
        </button>
        <div className={`w-px shrink-0 self-stretch my-2 ${tabBorder}`} aria-hidden />
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'parceiros'}
          aria-controls="chat-parceiros-panel"
          id={tabId('parceiros')}
          onClick={() => {
            setActiveTab('parceiros')
            setChatViewingState('parceiros')
          }}
          className={tabClass(activeTab === 'parceiros')}
        >
          Parceiros
          {hasUnreadParceiros && (
            <span className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 animate-pulse ${isLight ? 'ring-slate-100' : 'ring-slate-800'}`} aria-label="Novas mensagens em Parceiros" />
          )}
        </button>
        <div className={`w-px shrink-0 self-stretch my-2 ${tabBorder}`} aria-hidden />
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'comunicados'}
          aria-controls="chat-comunicados-panel"
          id={tabId('comunicados')}
          onClick={() => {
            setActiveTab('comunicados')
            setChatViewingState('comunicados')
          }}
          className={`${tabClass(activeTab === 'comunicados')} rounded-tr-xl`}
        >
          Comunicados
          {hasUnreadComunicadosGlobais && (
            <span className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 animate-pulse ${isLight ? 'ring-slate-100' : 'ring-slate-800'}`} aria-label="Novos comunicados por ler" />
          )}
        </button>
      </div>
      <div
        className={`flex-1 min-h-0 flex flex-col border border-t-0 rounded-b-xl overflow-hidden ${tabBorder} ${isLight ? 'bg-white' : 'bg-slate-900'}`}
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(activeTab)}
      >
        {renderPanel()}
      </div>
    </div>
  )
}
