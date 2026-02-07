import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import ContentChat from './ContentChat'
import ContentEquipa from './ContentEquipa'

export default function ContentChatUnified() {
  const { user, activeEquipaGrupo, isLight, chatMessages, chatEquipa, loadChatEquipa } = useApp()
  const userGrupo = (user?.grupo || '').trim()
  const isDirecaoGestor = user?.cargo === 'direcao' || user?.cargo === 'gestor'
  const showEquipa = userGrupo || isDirecaoGestor
  const grupo = activeEquipaGrupo || user?.grupo
  const [activeTab, setActiveTab] = useState('geral')
  const [lastViewedGeralAt, setLastViewedGeralAt] = useState(0)
  const [lastViewedEquipaAt, setLastViewedEquipaAt] = useState(0)

  const latestGeral = useMemo(() => {
    const list = Array.isArray(chatMessages) ? chatMessages : []
    if (list.length === 0) return 0
    return Math.max(...list.map((m) => (m?.timestamp ? new Date(m.timestamp).getTime() : 0)))
  }, [chatMessages])
  const latestEquipa = useMemo(() => {
    const list = Array.isArray(chatEquipa) ? chatEquipa : []
    if (list.length === 0) return 0
    return Math.max(...list.map((m) => (m?.timestamp ? new Date(m.timestamp).getTime() : 0)))
  }, [chatEquipa])

  useEffect(() => {
    const t = Date.now()
    if (activeTab === 'geral') setLastViewedGeralAt(t)
    else if (activeTab === 'equipa') setLastViewedEquipaAt(t)
  }, [activeTab])

  useEffect(() => {
    if (!showEquipa || !grupo) return
    loadChatEquipa(grupo)
    const id = setInterval(() => loadChatEquipa(grupo), 8000)
    return () => clearInterval(id)
  }, [showEquipa, grupo, loadChatEquipa])

  const hasNewGeral = activeTab !== 'geral' && latestGeral > lastViewedGeralAt
  const hasNewEquipa = activeTab !== 'equipa' && latestEquipa > lastViewedEquipaAt

  const tabBorder = isLight ? 'border-slate-200' : 'border-slate-600'
  const tabActiveBg = isLight ? 'bg-white border-sky-500/50' : 'bg-slate-900/80 border-sky-500/40'
  const tabInactiveBg = isLight ? 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400'
  const tabActiveText = isLight ? 'text-sky-700 font-semibold' : 'text-sky-300 font-semibold'

  return (
    <div className="flex flex-col min-h-[320px] h-full overflow-hidden">
      {showEquipa ? (
        <>
          <div className={`flex shrink-0 rounded-t-xl overflow-hidden border ${tabBorder} ${isLight ? 'bg-slate-100/90' : 'bg-slate-800/50'}`} role="tablist" aria-label="Chat Geral e Equipa">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'geral'}
              aria-controls="chat-geral-panel"
              id="tab-geral"
              onClick={() => setActiveTab('geral')}
              className={`relative px-5 py-3 min-h-[44px] transition ${activeTab === 'geral' ? `${tabActiveBg} rounded-t-xl border border-sky-500/40 shadow-sm ${tabActiveText}` : `border border-transparent ${tabInactiveBg}`}`}
            >
              Geral
              {hasNewGeral && (
                <span className={`absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 animate-pulse ${isLight ? 'ring-slate-100' : 'ring-slate-800'}`} aria-label="Novas mensagens no chat geral" />
              )}
            </button>
            <div className={`w-px shrink-0 self-stretch my-2 ${tabBorder}`} aria-hidden />
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'equipa'}
              aria-controls="chat-equipa-panel"
              id="tab-equipa"
              onClick={() => setActiveTab('equipa')}
              className={`relative px-5 py-3 min-h-[44px] transition ${activeTab === 'equipa' ? `${tabActiveBg} rounded-t-xl border border-sky-500/40 shadow-sm ${tabActiveText}` : `border border-transparent ${tabInactiveBg}`}`}
            >
              Equipa
              {hasNewEquipa && (
                <span className={`absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 animate-pulse ${isLight ? 'ring-slate-100' : 'ring-slate-800'}`} aria-label="Novas mensagens no chat da equipa" />
              )}
            </button>
          </div>
          <div className={`flex-1 min-h-0 flex flex-col border border-t-0 rounded-b-xl overflow-hidden ${tabBorder} ${isLight ? 'bg-white' : 'bg-slate-900'}`} role="tabpanel" id={activeTab === 'geral' ? 'chat-geral-panel' : 'chat-equipa-panel'} aria-labelledby={activeTab === 'geral' ? 'tab-geral' : 'tab-equipa'}>
            {activeTab === 'geral' ? <ContentChat /> : <ContentEquipa grupo={grupo} />}
          </div>
        </>
      ) : (
        <ContentChat />
      )}
    </div>
  )
}
