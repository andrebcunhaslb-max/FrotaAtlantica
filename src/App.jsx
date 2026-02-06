import { AppProvider, useApp } from './context/AppContext'
import Toast from './components/Toast'
import ConfirmModal from './components/ConfirmModal'
import LoginScreen from './components/LoginScreen'
import RecoveryScreen from './components/RecoveryScreen'
import Topbar from './components/Topbar'
import AppSidebar from './components/AppSidebar'
import ContentCalc from './components/ContentCalc'
import ContentVendas from './components/ContentVendas'
import ContentCompras from './components/ContentCompras'
import ContentFarm from './components/ContentFarm'
import ContentChat from './components/ContentChat'
import ContentAdmin from './components/ContentAdmin'
import ContentDashboard from './components/ContentDashboard'
import FiveMSidebar from './components/FiveMSidebar'

function MainLayout() {
  const { user, activeTab } = useApp()
  if (!user) return null
  return (
    <div className="flex flex-1 min-h-0 min-w-0">
      <AppSidebar />
      <div className="flex-1 min-w-0 py-5 px-6 transition duration-400 flex flex-col min-h-0 overflow-auto">
        {activeTab === 'dashboard' && <ContentDashboard />}
        {activeTab === 'calc' && <ContentCalc />}
        {activeTab === 'vendas' && <ContentVendas />}
        {activeTab === 'compras' && <ContentCompras />}
        {activeTab === 'farm' && <ContentFarm />}
        {activeTab === 'chat' && <ContentChat />}
        {activeTab === 'admin' && <ContentAdmin />}
      </div>
      <FiveMSidebar />
    </div>
  )
}

function AppContent() {
  const { user, authView, setAuthView } = useApp()
  return (
    <main className="glass-panel w-[80vw] h-[80vh] max-w-[1600px] max-h-[90vh] flex flex-col overflow-hidden shrink-0" id="main-content" aria-label="Conteúdo principal">
      {!user ? (
        authView === 'recovery' ? (
          <RecoveryScreen onBack={() => setAuthView('login')} />
        ) : (
          <LoginScreen onRecoveryClick={() => setAuthView('recovery')} />
        )
      ) : (
        <>
          <Topbar />
          <MainLayout />
        </>
      )}
    </main>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toast />
      <ConfirmModal />
    </AppProvider>
  )
}
