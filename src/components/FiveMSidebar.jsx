import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Users, Circle, Phone } from 'lucide-react'
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
  const { usuarios } = useApp()
  const [players, setPlayers] = useState([])
  const [sessionStart, setSessionStart] = useState({})
  const [popover, setPopover] = useState(null)
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 })
  const sidebarRef = useRef(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    if (!popover) return
    const close = (e) => {
      if (
        sidebarRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      )
        return
      setPopover(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [popover])

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
  const onlineCount = withNick.filter((u) => {
    const nick = stripFivemColors(u.fivem_nick || '').trim().toLowerCase()
    return nick && players.some((n) => n === nick || (nick.length >= 3 && n.includes(nick)))
  }).length

  const handleBadgeClick = (u, e) => {
    const nick = stripFivemColors(u.fivem_nick || '').trim().toLowerCase()
    const online = nick && players.some((n) => n === nick || (nick.length >= 3 && n.includes(nick)))
    if (!online) return
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

  if (withNick.length === 0) return null

  return (
    <>
      <aside
        ref={sidebarRef}
        className="w-[140px] min-w-[140px] py-3 px-3 border-l border-slate-600 bg-slate-900/60 flex flex-col items-stretch gap-2"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <Users className="h-3 w-3" />
          FiveM
        </span>
        <span className="text-[11px] text-slate-500 mb-1">
          {onlineCount}/{withNick.length} online
        </span>
        <div className="flex flex-col gap-1.5">
          {withNick.map((u) => {
            const nick = stripFivemColors(u.fivem_nick || '').trim().toLowerCase()
            const online =
              nick && players.some((n) => n === nick || (nick.length >= 3 && n.includes(nick)))
            return (
              <button
                key={u.id ?? u.nome}
                type="button"
                onClick={(e) => handleBadgeClick(u, e)}
                onMouseEnter={(e) => handleBadgeMouseEnter(u, e)}
                onMouseLeave={handleBadgeMouseLeave}
                className={`w-full flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs ${
                  online
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 cursor-pointer'
                    : 'border-slate-600 bg-slate-800/30 text-slate-500'
                }`}
              >
                <Circle
                  className={`h-1.5 w-1.5 shrink-0 ${online ? 'fill-emerald-400 text-emerald-400' : 'fill-slate-500 text-slate-500'}`}
                />
                {u.nome}
              </button>
            )
          })}
        </div>
      </aside>

      {typeof document !== 'undefined' && popover && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[100] min-w-[180px] rounded-xl border border-slate-600 bg-slate-900/98 px-4 py-3 shadow-xl"
          style={{
            left: Math.max(8, Math.min(popover.x ?? 0, window.innerWidth - 220)),
            top: Math.max(8, (popover.y ?? 0) - 60),
          }}
        >
          <div className="font-semibold mb-1">{popover.nome}</div>
          <div className="text-slate-500 text-sm flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {popover.telemovel || 'Sem telemóvel'}
          </div>
        </div>,
        document.body
      )}

      {typeof document !== 'undefined' && tooltip.show && createPortal(
        <div
          className="fixed z-[101] pointer-events-none rounded-lg border border-slate-600 px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.max(8, tooltip.x),
            top: tooltip.y,
            backgroundColor: document.documentElement.classList.contains('light') ? '#f1f5f9' : '#1e293b',
            color: document.documentElement.classList.contains('light') ? '#1e293b' : '#e2e8f0',
          }}
        >
          {tooltip.text}
        </div>,
        document.body
      )}
    </>
  )
}
