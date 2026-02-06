import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiDelete } from '../api'

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
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeSubtab, setActiveSubtab] = useState('relatorios')
  const [authView, setAuthView] = useState('login') // 'login' | 'recovery'
  const [usuarios, setUsuarios] = useState([])
  const [registos, setRegistos] = useState([])
  const [caixa, setCaixa] = useState(0)
  const [movimentos, setMovimentos] = useState([])
  const [apanhas, setApanhas] = useState([])
  const [metas, setMetas] = useState([])
  const [valorReceber, setValorReceber] = useState({})
  const [precoPeixe, setPrecoPeixe] = useState({ sem: 36, parceria: 38 })
  const [precoPeixePorUtilizador, setPrecoPeixePorUtilizador] = useState({})
  const [cicloInicio, setCicloInicio] = useState(null)
  const [cicloPorUtilizador, setCicloPorUtilizador] = useState({})
  const [tempoOnlineRank, setTempoOnlineRank] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatEquipa, setChatEquipa] = useState([])
  const [comunicadosEquipa, setComunicadosEquipa] = useState([])
  const [lastSeenComunicadoByGrupo, setLastSeenComunicadoByGrupo] = useState({})
  const [activeEquipaGrupo, setActiveEquipaGrupo] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    variant: 'default',
    onConfirm: null
  })

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
      const [u, r, cData, m, a, metasData, vrData, ppData, cicloData, toData] = await Promise.all([
        apiGet('usuarios').catch(() => []),
        apiGet('registos').catch(() => []),
        apiGet('caixa').catch(() => ({ valorTotal: 0 })),
        apiGet('movimentos').catch(() => []),
        apiGet('apanhas').catch(() => []),
        apiGet('metas').catch(() => []),
        apiGet('valor-receber').catch(() => ({})),
        apiGet('preco-peixe').catch(() => ({ sem: 36, parceria: 38 })),
        apiGet('ciclo-pagamento').catch(() => ({ cicloInicio: new Date().toISOString() })),
        apiGet('tempo-online').catch(() => ({ users: [] })),
      ])
      setUsuarios(Array.isArray(u) ? u : [])
      setRegistos(Array.isArray(r) ? r : [])
      setCaixa(cData?.valorTotal ?? 0)
      setMovimentos(Array.isArray(m) ? m : [])
      setApanhas(Array.isArray(a) ? a : [])
      setMetas(Array.isArray(metasData) ? metasData : [])
      setValorReceber(vrData && typeof vrData === 'object' && !Array.isArray(vrData) ? vrData : {})
      setPrecoPeixe(
        ppData && typeof ppData.sem === 'number' && typeof ppData.parceria === 'number'
          ? { sem: ppData.sem, parceria: ppData.parceria }
          : { sem: 36, parceria: 38 }
      )
      setPrecoPeixePorUtilizador(() => {
        const raw = ppData?.porUtilizador && typeof ppData.porUtilizador === 'object' ? ppData.porUtilizador : {}
        const out = {}
        for (const [uid, val] of Object.entries(raw)) {
          if (typeof val === 'number' && !Number.isNaN(val)) out[uid] = val
          else if (val && typeof val === 'object' && typeof val.sem === 'number') out[uid] = val.sem
        }
        return out
      })
      setCicloInicio(
        cicloData && typeof cicloData.cicloInicio === 'string' ? cicloData.cicloInicio : new Date().toISOString()
      )
      setCicloPorUtilizador(
        cicloData && cicloData.porUtilizador && typeof cicloData.porUtilizador === 'object'
          ? cicloData.porUtilizador
          : {}
      )
      setTempoOnlineRank(Array.isArray(toData?.users) ? toData.users : [])
    } catch (err) {
      console.warn('loadData', err)
      showToast('Erro ao carregar dados.', 'error')
    }
  }, [user, showToast])

  const tickTempoOnline = useCallback(async () => {
    if (!user?.id) return
    try {
      await apiPost('tempo-online', { userId: user.id, minutes: 5 })
      const toData = await apiGet('tempo-online')
      setTempoOnlineRank(Array.isArray(toData?.users) ? toData.users : [])
    } catch (err) {
      console.warn('tickTempoOnline', err)
    }
  }, [user])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  useEffect(() => {
    if (!user?.id) return
    const tick = () => {
      apiPost('tempo-online', { userId: user.id, minutes: 5 }).catch(() => {})
    }
    tick()
    const interval = setInterval(tick, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user?.id])

  useEffect(() => {
    if (!user) {
      apiGet('usuarios')
        .then((u) => {
          const list = Array.isArray(u) ? u : []
          setUsuarios(list)
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
  const saveMetas = useCallback(async (data) => {
    await apiPost('metas', data)
    setMetas(data)
  }, [])
  const saveValorReceber = useCallback(async (data) => {
    await apiPost('valor-receber', data)
    setValorReceber(data)
  }, [])

  const savePrecoPeixe = useCallback(async (data) => {
    await apiPost('preco-peixe', data)
    if (data.sem != null && data.parceria != null) setPrecoPeixe((prev) => ({ ...prev, sem: data.sem, parceria: data.parceria }))
    if (data.porUtilizador != null && typeof data.porUtilizador === 'object') {
      const out = {}
      for (const [uid, val] of Object.entries(data.porUtilizador)) {
        if (typeof val === 'number' && !Number.isNaN(val)) out[uid] = val
      }
      setPrecoPeixePorUtilizador(out)
    }
  }, [])

  const marcarPago = useCallback(async (userId, { aprovadoPor = null, valor = null } = {}) => {
    const id = userId != null ? String(userId) : null
    if (!id) return
    await apiPost('ciclo-pagamento/pagar', { userId: id, aprovadoPor: aprovadoPor || undefined, valor: valor != null ? valor : undefined })
    const now = new Date().toISOString()
    setCicloPorUtilizador((prev) => ({
      ...prev,
      [id]: { data: now, aprovadoPor: aprovadoPor || undefined, valor: valor != null ? valor : undefined }
    }))
    setMetas((prev) => (Array.isArray(prev) ? prev.filter((m) => String(m.userId) !== id) : []))
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

  const loadChatEquipa = useCallback(async (grupo) => {
    if (!grupo) return
    try {
      const list = await apiGet(`chat?grupo=${encodeURIComponent(grupo)}`)
      setChatEquipa(Array.isArray(list) ? list : [])
    } catch (err) {
      console.warn('loadChatEquipa', err)
      setChatEquipa([])
    }
  }, [])

  const sendChatEquipa = useCallback(
    async (grupo, text) => {
      if (!user || !grupo || !String(text).trim()) return
      try {
        await apiPost('chat', {
          userId: user.id,
          userName: user.nome,
          cargo: user.cargo ?? '',
          grupo,
          text: String(text).trim()
        })
        await loadChatEquipa(grupo)
      } catch (err) {
        console.warn('sendChatEquipa', err)
        showToast('Erro ao enviar mensagem.', 'error')
      }
    },
    [user, loadChatEquipa, showToast]
  )

  const loadComunicados = useCallback(async (grupo) => {
    if (!grupo) return
    try {
      const list = await apiGet(`comunicados?grupo=${encodeURIComponent(grupo)}`)
      setComunicadosEquipa(Array.isArray(list) ? list : [])
    } catch (err) {
      console.warn('loadComunicados', err)
      setComunicadosEquipa([])
    }
  }, [])

  const sendComunicado = useCallback(
    async (grupo, text) => {
      if (!user || !grupo || !String(text).trim()) return
      try {
        await apiPost('comunicados', {
          userId: user.id,
          userName: user.nome,
          grupo,
          text: String(text).trim()
        })
        await loadComunicados(grupo)
      } catch (err) {
        console.warn('sendComunicado', err)
        showToast('Erro ao publicar comunicado.', 'error')
      }
    },
    [user, loadComunicados, showToast]
  )

  const deleteChatMessageEquipa = useCallback(
    async (grupo, messageId) => {
      if (!user || !grupo || messageId == null) return
      try {
        await apiDelete('chat-equipa', { grupo, messageId, userId: user.id })
        await loadChatEquipa(grupo)
        showToast('Mensagem apagada.', 'success')
      } catch (err) {
        console.warn('deleteChatMessageEquipa', err)
        showToast(err.message || 'Erro ao apagar mensagem.', 'error')
      }
    },
    [user, loadChatEquipa, showToast]
  )

  const deleteComunicado = useCallback(
    async (grupo, messageId) => {
      if (!user || !grupo || messageId == null) return
      try {
        await apiDelete('comunicados', { grupo, messageId, userId: user.id })
        await loadComunicados(grupo)
        showToast('Comunicado apagado.', 'success')
      } catch (err) {
        console.warn('deleteComunicado', err)
        showToast(err.message || 'Erro ao apagar comunicado.', 'error')
      }
    },
    [user, loadComunicados, showToast]
  )

  const markComunicadosAsSeen = useCallback((grupo, list) => {
    if (!grupo) return
    setLastSeenComunicadoByGrupo((prev) => {
      const arr = Array.isArray(list) ? list : comunicadosEquipa
      if (!arr.length) return { ...prev, [grupo]: Date.now() }
      const latest = Math.max(...arr.map((m) => new Date(m.timestamp || 0).getTime()))
      return { ...prev, [grupo]: latest }
    })
  }, [comunicadosEquipa])

  const hasUnreadComunicados = useCallback(
    (grupo) => {
      if (!grupo || !Array.isArray(comunicadosEquipa) || comunicadosEquipa.length === 0) return false
      const lastSeen = lastSeenComunicadoByGrupo[grupo] || 0
      return comunicadosEquipa.some((m) => new Date(m.timestamp || 0).getTime() > lastSeen)
    },
    [comunicadosEquipa, lastSeenComunicadoByGrupo]
  )

  useEffect(() => {
    const grupo = (user?.grupo || '').trim() || activeEquipaGrupo
    if (!grupo) return
    loadComunicados(grupo)
    const id = setInterval(() => loadComunicados(grupo), 8000)
    return () => clearInterval(id)
  }, [user?.grupo, activeEquipaGrupo, loadComunicados])

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

  const showConfirm = useCallback((config) => {
    setConfirmModal({
      open: true,
      title: config.title ?? '',
      message: config.message ?? '',
      confirmLabel: config.confirmLabel ?? 'Confirmar',
      cancelLabel: config.cancelLabel ?? 'Cancelar',
      variant: config.variant ?? 'default',
      onConfirm: typeof config.onConfirm === 'function' ? config.onConfirm : null
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, open: false }))
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
    metas,
    setMetas,
    valorReceber,
    setValorReceber,
    precoPeixe,
    setPrecoPeixe,
    precoPeixePorUtilizador,
    setPrecoPeixePorUtilizador,
    cicloInicio,
    setCicloInicio,
    cicloPorUtilizador,
    setCicloPorUtilizador,
    tempoOnlineRank,
    setTempoOnlineRank,
    tickTempoOnline,
    chatMessages,
    loadChat,
    sendChatMessage,
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
    loadData,
    saveUsuarios,
    saveRegistos,
    saveCaixa,
    saveMovimentos,
    saveApanhas,
    saveMetas,
    saveValorReceber,
    savePrecoPeixe,
    marcarPago,
    confirmModal,
    showConfirm,
    closeConfirm,
    sidebarOpen,
    setSidebarOpen,
    activeEquipaGrupo,
    setActiveEquipaGrupo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
