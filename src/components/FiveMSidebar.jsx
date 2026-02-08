import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Users, Circle, Phone, Copy } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { apiGet } from '../api'

function stripFivemColors(s) {
  if (typeof s !== 'string') return ''
  return s.replace(/\^./g, '').replace(/~[^~]*~/g, '').trim()
}

function formatarDuracao(ms) {
  if (ms < 60000) return 'há ' + Math.round(ms / 1000) + ' s'
  if (ms < 3600000) return 'há ' + Math.round(ms / 60000) + ' min'
  const h = Math.floor(ms / 3600000)
  const m = Math.round((ms % 3600000) / 60000)
  return m > 0 ? 'há ' + h + 'h ' + m + 'm' : 'há ' + h + 'h'
}

export default function FiveMSidebar() {
  const { usuarios, isLight, showToast } = useApp()
  const [players, setPlayers] = useState([])
  const [sessionStart, setSessionStart] = useState({})
  const [popover, setPopover] = useState(null)
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 })
  const [mobileOpen, setMobileOpen] = useState(false)
  const sidebarRef = useRef(null)
  const popoverRef = useRef(null)
  const mobilePanelRef = useRef(null)

  useEffect(() => {
    if (!popover) return
    const close = (e) => {
      if (
        sidebarRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target) ||
        mobilePanelRef.current?.contains(e.target)
      )
        return
      setPopover(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [popover])

  useEffect(() => {
    if (!mobileOpen) return
    const close = (e) => {
      if (mobilePanelRef.current?.contains(e.target) || (e.target?.closest?.('[data-fivem-fab]'))) return
      setMobileOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [mobileOpen])

  const fetchPlayers = useCallback(async () => {
    try {
      const data = await apiGet('fivem-players?code=875vq5')
      const rawNames = (data.players || []).map((p) => stripFivemColors(p.name) || p.name || '')
      const nicks = rawNames.map((n) => n.trim().toLowerCase()).filter(Boolean)
      setPlayers(nicks)
      const withNick = usuarios.filter((u) => u.fivem_nick)
      const now = Date.now()
      setSessionStart((prev) => {
        const next = { ...prev }
        withNick.forEach((u) => {
          const nick = stripFivemColors(u.fivem_nick || '').trim().toLowerCase()
          const online = nick && nicks.some((n) => n === nick || (nick.length >= 3 && n.includes(nick)))
          if (online) {
            if (!next[nick]) next[nick] = now
          } else {
            delete next[nick]
          }
        })
        Object.keys(next).forEach((nick) => {
          if (!nicks.some((n) => n === nick || (nick.length >= 3 && n.includes(nick))))
            delete next[nick]
        })
        return next
      })
    } catch (err) {
      console.warn('FiveM:', err.message)
    }
  }, [usuarios])

  useEffect(() => {
    if (usuarios.length === 0) return
    fetchPlayers()
    const id = setInterval(fetchPlayers, 5000)
    return () => clearInterval(id)
  }, [usuarios.length, fetchPlayers])

  const withNick = usuarios.filter((u) => u.fivem_nick)
  const onlineMembers = withNick.filter((u) => {
    const nick = stripFivemColors(u.fivem_nick || '').trim().toLowerCase()
    return nick && players.some((n) => n === nick || (nick.length >= 3 && n.includes(nick)))
  })
  const onlineCount = onlineMembers.length

  const handleBadgeClick = (u, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPopover((prev) =>
      prev?.nome === u.nome ? null : { nome: u.nome, telemovel: u.telemovel, x: rect.left, y: rect.top }
    )
  }

  const handleBadgeMouseEnter = (u, e) => {
    const nick = stripFivemColors(u.fivem_nick || '').trim().toLowerCase()
    const online = nick && players.some((n) => n === nick || (nick.length >= 3 && n.includes(nick)))
    if (!online) return
    const start = sessionStart[nick]
    const text = start ? 'Online há: ' + formatarDuracao(Date.now() - start) : 'Online há: —'
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ show: true, text, x: rect.left - 140, y: rect.top })
  }

  const handleBadgeMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, show: false }))
  }

  const handleCopyTelemovel = useCallback(
    async (telemovel) => {
      if (!telemovel?.trim()) return
      try {
        await navigator.clipboard.writeText(String(telemovel).trim())
        showToast?.('Número copiado para a área de transferência.', 'success')
      } catch (_) {
        showToast?.('Erro ao copiar número.', 'error')
      }
    },
    [showToast]
  )

  const panelContent = (
    <>
      <span className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
        <Users className="h-3 w-3" />
        FiveM
      </span>
      <span className={`text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
        {onlineCount} online
      </span>
      <div className="flex flex-col gap-1.5">
        {onlineMembers.map((u) => (
          <button
            key={u.id ?? u.nome}
            type="button"
            onClick={(e) => handleBadgeClick(u, e)}
            onMouseEnter={(e) => handleBadgeMouseEnter(u, e)}
            onMouseLeave={handleBadgeMouseLeave}
            className={`w-full flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs min-h-[44px] ${
              isLight
                ? 'border-emerald-400/60 bg-emerald-50 text-emerald-600 cursor-pointer'
                : 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 cursor-pointer'
            }`}
          >
            <Circle
              className={`h-1.5 w-1.5 shrink-0 ${isLight ? 'fill-emerald-500 text-emerald-500' : 'fill-emerald-400 text-emerald-400'}`}
            />
            {u.nome}
          </button>
        ))}
      </div>
    </>
  )

  if (onlineMembers.length === 0) return null

  return (
    <>
      {/* Desktop: fixed sidebar from md */}
      <aside
        ref={sidebarRef}
        className={`hidden md:flex md:w-[140px] md:min-w-[140px] py-3 px-3 border-l flex-col items-stretch gap-2 ${
          isLight ? 'border-slate-200 bg-slate-50/90' : 'border-slate-600 bg-slate-900/60'
        }`}
      >
        {panelContent}
      </aside>

      {/* Mobile: floating button + popover panel */}
      <div className="md:hidden fixed bottom-4 right-4 z-40" data-fivem-fab>
        {mobileOpen && (
          <div
            ref={mobilePanelRef}
            className={`absolute bottom-14 right-0 w-[min(280px,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto rounded-xl border shadow-xl py-3 px-3 flex flex-col gap-2 ${
              isLight ? 'border-slate-200 bg-white' : 'border-slate-600 bg-slate-900'
            }`}
          >
            {panelContent}
          </div>
        )}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className={`min-w-[48px] min-h-[48px] rounded-full shadow-lg flex items-center justify-center ${
            isLight ? 'bg-slate-100 border border-slate-300 text-slate-700' : 'bg-slate-800 border border-slate-600 text-slate-300'
          }`}
          aria-label={mobileOpen ? 'Fechar FiveM' : 'Abrir FiveM'}
        >
          <Users className="h-5 w-5" />
        </button>
      </div>

      {typeof document !== 'undefined' && popover && createPortal(
        <div
          ref={popoverRef}
          className={`fixed z-[100] min-w-[180px] max-w-[calc(100vw-16px)] rounded-xl border px-4 py-3 shadow-xl ${
            isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-slate-600 bg-slate-900 text-slate-200'
          }`}
          style={{
            left: Math.max(8, Math.min(popover.x ?? 0, window.innerWidth - 220)),
            top: Math.max(8, Math.min((popover.y ?? 0) - 60, window.innerHeight - 80)),
          }}
        >
          <div className="font-semibold mb-1">{popover.nome}</div>
          <div className={`text-sm flex items-center justify-between gap-2 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1 min-w-0">
              <Phone className="h-3 w-3 shrink-0" />
              {popover.telemovel || 'Sem telemóvel'}
            </span>
            {popover.telemovel?.trim() && (
              <button
                type="button"
                onClick={() => handleCopyTelemovel(popover.telemovel)}
                className={`shrink-0 p-1 rounded-lg transition ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'}`}
                aria-label="Copiar número de telemóvel"
                title="Copiar número"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {typeof document !== 'undefined' && tooltip.show && createPortal(
        <div
          className={`fixed z-[101] pointer-events-none rounded-lg border px-3 py-2 text-xs shadow-lg ${
            isLight ? 'border-slate-200 bg-slate-100 text-slate-800' : 'border-slate-600 bg-slate-800 text-slate-200'
          }`}
          style={{
            left: Math.max(8, tooltip.x),
            top: tooltip.y,
          }}
        >
          {tooltip.text}
        </div>,
        document.body
      )}
    </>
  )
}
