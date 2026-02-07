import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
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
  const [precoPlastico, setPrecoPlastico] = useState({ sem: 3, parceria: 38 })
  const [precoPlasticoPorUtilizador, setPrecoPlasticoPorUtilizador] = useState({})
  const [apanhasPlastico, setApanhasPlastico] = useState([])
  const [cicloInicio, setCicloInicio] = useState(null)
  const [cicloPorUtilizador, setCicloPorUtilizador] = useState({})
  const [cicloPlasticoPorUtilizador, setCicloPlasticoPorUtilizador] = useState({})
  const [metasPlastico, setMetasPlastico] = useState([])
  const [armazemPatrao, setArmazemPatrao] = useState([])
  const [tempoOnlineRank, setTempoOnlineRank] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatEquipa, setChatEquipa] = useState([])
  const [comunicadosEquipa, setComunicadosEquipa] = useState([])
  const [lastSeenComunicadoByGrupo, setLastSeenComunicadoByGrupo] = useState({})
  const [activeEquipaGrupo, setActiveEquipaGrupo] = useState(null)
  const [lastViewedChatGeralAt, setLastViewedChatGeralAt] = useState(0)
  const [lastViewedChatEquipaAt, setLastViewedChatEquipaAt] = useState(0)
  const [chatViewingState, setChatViewingStateInternal] = useState(null) // 'geral' | 'equipa' | null
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
      const [u, r, cData, m, a, metasData, vrData, ppData, ppPlasticoData, aPlastico, cicloData, cicloPlasticoData, metasPlasticoData, apData, toData] = await Promise.all([
        apiGet('usuarios').catch(() => []),
        apiGet('registos').catch(() => []),
        apiGet('caixa').catch(() => ({ valorTotal: 0 })),
        apiGet('movimentos').catch(() => []),
        apiGet('apanhas').catch(() => []),
        apiGet('metas').catch(() => []),
        apiGet('valor-receber').catch(() => ({})),
        apiGet('preco-peixe').catch(() => ({ sem: 36, parceria: 38 })),
        apiGet('preco-plastico').catch(() => ({ sem: 3, parceria: 38 })),
        apiGet('apanhas-plastico').catch(() => []),
        apiGet('ciclo-pagamento').catch(() => ({ cicloInicio: new Date().toISOString() })),
        apiGet('ciclo-pagamento-plastico').catch(() => ({ cicloInicio: new Date().toISOString(), porUtilizador: {} })),
        apiGet('metas-plastico').catch(() => []),
        apiGet('armazem-patrao').catch(() => []),
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
      setPrecoPlastico(
        ppPlasticoData && typeof ppPlasticoData.sem === 'number' && typeof ppPlasticoData.parceria === 'number'
          ? { sem: ppPlasticoData.sem, parceria: ppPlasticoData.parceria }
          : { sem: 3, parceria: 38 }
      )
      setPrecoPlasticoPorUtilizador(() => {
        const raw = ppPlasticoData?.porUtilizador && typeof ppPlasticoData.porUtilizador === 'object' ? ppPlasticoData.porUtilizador : {}
        const out = {}
        for (const [uid, val] of Object.entries(raw)) {
          if (typeof val === 'number' && !Number.isNaN(val)) out[uid] = val
          else if (val && typeof val === 'object' && typeof val.sem === 'number') out[uid] = val.sem
        }
        return out
      })
      setApanhasPlastico(Array.isArray(aPlastico) ? aPlastico : [])
      setCicloInicio(
        cicloData && typeof cicloData.cicloInicio === 'string' ? cicloData.cicloInicio : new Date().toISOString()
      )
      setCicloPorUtilizador(
        cicloData && cicloData.porUtilizador && typeof cicloData.porUtilizador === 'object'
          ? cicloData.porUtilizador
          : {}
      )
      setCicloPlasticoPorUtilizador(
        cicloPlasticoData && cicloPlasticoData.porUtilizador && typeof cicloPlasticoData.porUtilizador === 'object'
          ? cicloPlasticoData.porUtilizador
          : {}
      )
      setMetasPlastico(Array.isArray(metasPlasticoData) ? metasPlasticoData : [])
      setArmazemPatrao(Array.isArray(apData) ? apData : [])
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
  const saveApanhasPlastico = useCallback(async (data) => {
    await apiPost('apanhas-plastico', data)
    setApanhasPlastico(data)
  }, [])
  const saveMetas = useCallback(async (data) => {
    await apiPost('metas', data)
    setMetas(data)
  }, [])
  const saveMetasPlastico = useCallback(async (data) => {
    await apiPost('metas-plastico', data)
    setMetasPlastico(data)
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

  const savePrecoPlastico = useCallback(async (data) => {
    await apiPost('preco-plastico', data)
    if (data.sem != null && data.parceria != null) setPrecoPlastico((prev) => ({ ...prev, sem: data.sem, parceria: data.parceria }))
    if (data.porUtilizador != null && typeof data.porUtilizador === 'object') {
      const out = {}
      for (const [uid, val] of Object.entries(data.porUtilizador)) {
        if (typeof val === 'number' && !Number.isNaN(val)) out[uid] = val
      }
      setPrecoPlasticoPorUtilizador(out)
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

  const marcarPagoPlastico = useCallback(async (userId, { aprovadoPor = null, valor = null } = {}) => {
    const id = userId != null ? String(userId) : null
    if (!id) return
    await apiPost('ciclo-pagamento-plastico/pagar', { userId: id, aprovadoPor: aprovadoPor || undefined, valor: valor != null ? valor : undefined })
    const now = new Date().toISOString()
    setCicloPlasticoPorUtilizador((prev) => ({
      ...prev,
      [id]: { data: now, aprovadoPor: aprovadoPor || undefined, valor: valor != null ? valor : undefined }
    }))
    setMetasPlastico((prev) => (Array.isArray(prev) ? prev.filter((m) => String(m.userId) !== id) : []))
  }, [])

  const saveArmazemPatraoRegisto = useCallback(async ({ itens, registadoPor, tipo }) => {
    const res = await apiPost('armazem-patrao', { itens, registadoPor: registadoPor || undefined, tipo: tipo || undefined })
    if (res?.registo) {
      setArmazemPatrao((prev) => [...(Array.isArray(prev) ? prev : []), res.registo])
    } else {
      const list = await apiGet('armazem-patrao')
      setArmazemPatrao(Array.isArray(list) ? list : [])
    }
  }, [])

  const deleteArmazemPatraoRegisto = useCallback(async (id) => {
    await apiDelete('armazem-patrao', { id })
    setArmazemPatrao((prev) => (Array.isArray(prev) ? prev.filter((r) => String(r.id) !== String(id)) : []))
  }, [])

  const loadChat = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9580856c-7f30-4bf9-a5d2-e0418a6e2a45',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppContext.jsx:loadChat',message:'loadChat called',data:{},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
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

  const setChatViewingState = useCallback((state) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9580856c-7f30-4bf9-a5d2-e0418a6e2a45',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppContext.jsx:setChatViewingState',message:'setChatViewingState',data:{state},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    setChatViewingStateInternal(state)
    const t = Date.now()
    if (state === 'geral') setLastViewedChatGeralAt(t)
    else if (state === 'equipa') setLastViewedChatEquipaAt(t)
  }, [])

  const latestChatGeralTs = useMemo(() => {
    const list = Array.isArray(chatMessages) ? chatMessages : []
    if (list.length === 0) return 0
    return Math.max(...list.map((m) => (m?.timestamp ? new Date(m.timestamp).getTime() : 0)))
  }, [chatMessages])
  const latestChatEquipaTs = useMemo(() => {
    const list = Array.isArray(chatEquipa) ? chatEquipa : []
    if (list.length === 0) return 0
    return Math.max(...list.map((m) => (m?.timestamp ? new Date(m.timestamp).getTime() : 0)))
  }, [chatEquipa])
  const hasUnreadChatGeral = useMemo(
    () => latestChatGeralTs > lastViewedChatGeralAt && chatViewingState !== 'geral',
    [latestChatGeralTs, lastViewedChatGeralAt, chatViewingState]
  )
  const hasUnreadChatEquipa = useMemo(
    () => latestChatEquipaTs > lastViewedChatEquipaAt && chatViewingState !== 'equipa',
    [latestChatEquipaTs, lastViewedChatEquipaAt, chatViewingState]
  )
  const hasUnreadChat = useMemo(() => hasUnreadChatGeral || hasUnreadChatEquipa, [hasUnreadChatGeral, hasUnreadChatEquipa])

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/9580856c-7f30-4bf9-a5d2-e0418a6e2a45',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppContext.jsx:unread-state',message:'unread state',data:{chatMessagesLen:Array.isArray(chatMessages)?chatMessages.length:0,chatEquipaLen:Array.isArray(chatEquipa)?chatEquipa.length:0,latestChatGeralTs,latestChatEquipaTs,lastViewedChatGeralAt,lastViewedChatEquipaAt,chatViewingState,hasUnreadChatGeral,hasUnreadChatEquipa},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  }, [chatMessages, chatEquipa, latestChatGeralTs, latestChatEquipaTs, lastViewedChatGeralAt, lastViewedChatEquipaAt, chatViewingState, hasUnreadChatGeral, hasUnreadChatEquipa]);
  // #endregion

  useEffect(() => {
    const grupo = (user?.grupo || '').trim() || activeEquipaGrupo
    if (!grupo) return
    loadComunicados(grupo)
    const id = setInterval(() => loadComunicados(grupo), 8000)
    return () => clearInterval(id)
  }, [user?.grupo, activeEquipaGrupo, loadComunicados])

  useEffect(() => {
    if (!user) return
    loadChat()
    const id = setInterval(loadChat, 8000)
    return () => clearInterval(id)
  }, [user, loadChat])

  useEffect(() => {
    const grupo = (user?.grupo || '').trim() || activeEquipaGrupo
    if (!grupo) return
    loadChatEquipa(grupo)
    const id = setInterval(() => loadChatEquipa(grupo), 8000)
    return () => clearInterval(id)
  }, [user?.grupo, activeEquipaGrupo, loadChatEquipa])

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
    precoPlastico,
    setPrecoPlastico,
    precoPlasticoPorUtilizador,
    setPrecoPlasticoPorUtilizador,
    apanhasPlastico,
    saveApanhasPlastico,
    savePrecoPlastico,
    cicloInicio,
    setCicloInicio,
    cicloPorUtilizador,
    setCicloPorUtilizador,
    cicloPlasticoPorUtilizador,
    metasPlastico,
    saveMetasPlastico,
    marcarPagoPlastico,
    armazemPatrao,
    saveArmazemPatraoRegisto,
    deleteArmazemPatraoRegisto,
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
    setChatViewingState,
    hasUnreadChat,
    hasUnreadChatGeral,
    hasUnreadChatEquipa,
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
