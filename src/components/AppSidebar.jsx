import { useEffect } from 'react'
import { Calculator, ShoppingCart, Package, Fish, MessageCircle, Settings, LayoutDashboard, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'calc', label: 'Calculadora', Icon: Calculator },
  { id: 'vendas', label: 'Vendas a Empresas', Icon: ShoppingCart },
  { id: 'compras', label: 'Comprar Peixes', Icon: Package },
  { id: 'farm', label: 'Farm', Icon: Fish },
  { id: 'chat', label: 'Chat', Icon: MessageCircle },
  { id: 'admin', label: 'Administração', Icon: Settings },
]

const asideClass = (isLight) =>
  `sidebar flex flex-col border-r py-5 px-3 ${
    isLight ? 'border-slate-200 bg-white/70' : 'border-slate-600 bg-slate-900/70'
  }`

const itemClass = (isActive, isLight) =>
  `sidebar-item flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left text-sm font-medium min-h-[44px] transition ${
    isActive
      ? 'sidebar-item-active bg-gradient-to-r from-sky-500/20 to-sky-600/10 border border-sky-500/40 text-sky-400'
      : isLight
        ? 'border border-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
        : 'border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
  }`

export default function AppSidebar() {
  const { user, activeTab, setActiveTab, logout, isLight, sidebarOpen, setSidebarOpen, hasUnreadComunicados, activeEquipaGrupo } = useApp()
  const showAdmin =
    user?.cargo === 'direcao' || user?.cargo === 'gestor' || user?.cargo === 'supervisor'

  const userGrupo = (user?.grupo || '').trim()
  const baseItems = SIDEBAR_ITEMS.filter((t) => t.id !== 'admin' || showAdmin)
  const items = baseItems

  useEffect(() => {
    if (!sidebarOpen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [sidebarOpen, setSidebarOpen])

  const onSelect = (id) => {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  const navContent = (
    <>
      <nav className="flex flex-col gap-1 flex-1 min-h-0">
        {items.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          const grupoForBadge = userGrupo || activeEquipaGrupo
          const showComunicadoBadge = id === 'chat' && grupoForBadge && hasUnreadComunicados?.(grupoForBadge)
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`${itemClass(isActive, isLight)} relative`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {label}
              {showComunicadoBadge && (
                <span
                  className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                  aria-label="Novo comunicado"
                />
              )}
            </button>
          )
        })}
      </nav>
      <div className={`pt-3 mt-auto border-t ${isLight ? 'border-slate-200' : 'border-slate-600/60'}`}>
        <button
          type="button"
          onClick={() => {
            setSidebarOpen(false)
            logout()
          }}
          className={`sidebar-item flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left text-sm font-medium border border-transparent min-h-[44px] transition ${
            isLight
              ? 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop: fixed width from md */}
      <aside
        className={`hidden md:flex md:w-[240px] md:min-w-[240px] ${asideClass(isLight)}`}
        aria-label="Menu principal"
      >
        {navContent}
      </aside>

      {/* Mobile: overlay + drawer when open */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" aria-hidden>
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          />
          <aside
            className={`relative w-[240px] max-w-[85vw] flex-shrink-0 ${asideClass(isLight)}`}
            aria-label="Menu principal"
          >
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
