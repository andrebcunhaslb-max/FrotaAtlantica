import { Calculator, ShoppingCart, Package, Fish, MessageCircle, Settings } from 'lucide-react'
import { useApp } from '../context/AppContext'

const SIDEBAR_ITEMS = [
  { id: 'calc', label: 'Calculadora', Icon: Calculator },
  { id: 'vendas', label: 'Vendas a Empresas', Icon: ShoppingCart },
  { id: 'compras', label: 'Comprar Peixes', Icon: Package },
  { id: 'farm', label: 'Farm', Icon: Fish },
  { id: 'chat', label: 'Chat', Icon: MessageCircle },
  { id: 'admin', label: 'Administração', Icon: Settings },
]

export default function AppSidebar() {
  const { user, activeTab, setActiveTab } = useApp()
  const showAdmin =
    user?.cargo === 'direcao' || user?.cargo === 'gestor' || user?.cargo === 'supervisor'

  const items = SIDEBAR_ITEMS.filter((t) => t.id !== 'admin' || showAdmin)

  return (
    <aside
      className="sidebar w-[240px] min-w-[240px] flex flex-col border-r border-slate-600 bg-slate-900/70 py-5 px-3"
      aria-label="Menu principal"
    >
      <nav className="flex flex-col gap-1">
        {items.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`sidebar-item flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? 'sidebar-item-active bg-gradient-to-r from-sky-500/20 to-sky-600/10 border border-sky-500/40 text-sky-400'
                  : 'border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
