import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost } from '../api'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }) {
  const [isLight, setIsLight] = useState(() => {
    try {
      return localStorage.getItem('temaFrota') === 'light'
    } catch {
      return false
    }
  })
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('userAtual')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [activeTab, setActiveTab] = useState('calc')
  const [activeSubtab, setActiveSubtab] = useState('relatorios')
  const [authView, setAuthView] = useState('login') // 'login' | 'recovery'
  const [usuarios, setUsuarios] = useState([])
  const [registos, setRegistos] = useState([])
  const [caixa, setCaixa] = useState(0)
  const [movimentos, setMovimentos] = useState([])
  const [apanhas, setApanhas] = useState([])
  const [chatMessages, setChatMessages] = useState([])

  useEffect(() => {
    document.documentElement.classList.toggle('light', isLight)
    try {
      localStorage.setItem('temaFrota', isLight ? 'light' : 'dark')
    } catch (_) {}
  }, [isLight])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type })
  }, [])

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const [u, r, cData, m, a] = await Promise.all([
        apiGet('usuarios').catch(() => []),
        apiGet('registos').catch(() => []),
        apiGet('caixa').catch(() => ({ valorTotal: 0 })),
        apiGet('movimentos').catch(() => []),
        apiGet('apanhas').catch(() => []),
      ])
      setUsuarios(Array.isArray(u) ? u : [])
      setRegistos(Array.isArray(r) ? r : [])
      setCaixa(cData?.valorTotal ?? 0)
      setMovimentos(Array.isArray(m) ? m : [])
      setApanhas(Array.isArray(a) ? a : [])
    } catch (err) {
      console.warn('loadData', err)
      showToast('Erro ao carregar dados.', 'error')
    }
  }, [user, showToast])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  useEffect(() => {
    if (!user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c893ed90-26c3-4af2-b13d-17050665f523',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppContext.jsx:fetch usuarios start',message:'GET usuarios called',data:{user:!!user},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      apiGet('usuarios')
        .then((u) => {
          const list = Array.isArray(u) ? u : []
          setUsuarios(list)
          // #region agent log
          const first = list[0]
          fetch('http://127.0.0.1:7242/ingest/c893ed90-26c3-4af2-b13d-17050665f523',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppContext.jsx:setUsuarios',message:'usuarios set',data:{length:list.length,firstNome:first?.nome,firstPin:first?.pin,firstPinType:typeof first?.pin},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
        })
        .catch((err) => {
          console.warn('Carregar utilizadores:', err)
          setUsuarios([])
          showToast('Erro ao ligar ao servidor. Verifique se a API está a correr.', 'error')
        })
    }
  }, [user, showToast])

  const saveUsuarios = useCallback(async (data) => {
    await apiPost('usuarios', data)
    setUsuarios(data)
  }, [])
  const saveRegistos = useCallback(async (data) => {
    await apiPost('registos', data)
    setRegistos(data)
  }, [])
  const saveCaixa = useCallback(async (valorTotal) => {
    await apiPost('caixa', { valorTotal })
    setCaixa(valorTotal)
  }, [])
  const saveMovimentos = useCallback(async (data) => {
    await apiPost('movimentos', data)
    setMovimentos(data)
  }, [])
  const saveApanhas = useCallback(async (data) => {
    await apiPost('apanhas', data)
    setApanhas(data)
  }, [])

  const loadChat = useCallback(async () => {
    try {
      const list = await apiGet('chat')
      setChatMessages(Array.isArray(list) ? list : [])
    } catch (err) {
      console.warn('loadChat', err)
      setChatMessages([])
    }
  }, [])

  const sendChatMessage = useCallback(
    async (text) => {
      if (!user || !String(text).trim()) return
      try {
        await apiPost('chat', {
          userId: user.id,
          userName: user.nome,
          cargo: user.cargo ?? '',
          text: String(text).trim()
        })
        await loadChat()
      } catch (err) {
        console.warn('sendChatMessage', err)
        showToast('Erro ao enviar mensagem.', 'error')
      }
    },
    [user, loadChat, showToast]
  )

  const login = useCallback((u) => {
    setUser(u)
    try {
      localStorage.setItem('userAtual', JSON.stringify(u))
    } catch (_) {}
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem('userAtual')
    } catch (_) {}
    window.location.reload()
  }, [])

  const value = {
    isLight,
    setIsLight,
    user,
    setUser,
    login,
    logout,
    toast,
    setToast,
    showToast,
    activeTab,
    setActiveTab,
    activeSubtab,
    setActiveSubtab,
    authView,
    setAuthView,
    usuarios,
    setUsuarios,
    registos,
    setRegistos,
    caixa,
    setCaixa,
    movimentos,
    setMovimentos,
    apanhas,
    setApanhas,
    chatMessages,
    loadChat,
    sendChatMessage,
    loadData,
    saveUsuarios,
    saveRegistos,
    saveCaixa,
    saveMovimentos,
    saveApanhas,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
