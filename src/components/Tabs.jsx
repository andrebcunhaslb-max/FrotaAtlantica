import { Calculator, ShoppingCart, Package, Fish, Settings } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TABS = [
  { id: 'calc', label: 'Calculadora', Icon: Calculator },
  { id: 'vendas', label: 'Vendas a Empresas', Icon: ShoppingCart },
  { id: 'compras', label: 'Comprar Peixes', Icon: Package },
  { id: 'farm', label: 'Farm', Icon: Fish },
  { id: 'admin', label: 'Administração', Icon: Settings },
]

export default function Tabs() {
  const { user, activeTab, setActiveTab } = useApp()
  const showAdmin =
    user?.cargo === 'direcao' || user?.cargo === 'gestor' || user?.cargo === 'supervisor'

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {TABS.filter((t) => t.id !== 'admin' || showAdmin).map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setActiveTab(id)}
          className={`pill ${activeTab === id ? 'pill-active' : ''}`}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}
