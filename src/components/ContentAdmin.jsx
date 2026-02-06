import { useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  RefreshCw,
  Save,
  Trash2,
  Edit,
  UserPlus,
  X,
  Banknote,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const SUBTABS = [
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'caixa', label: 'Caixa' },
  { id: 'apanhas', label: 'Apanhas de Peixe' },
  { id: 'utilizadores', label: 'Utilizadores' },
  { id: 'metas', label: 'Metas e Valor a Receber' },
  { id: 'pagamentos', label: 'Histórico de Pagamentos' },
]

function parseDataRegisto(str) {
  if (!str) return null
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
}

export default function ContentAdmin() {
  const {
    user,
    activeSubtab,
    setActiveSubtab,
    usuarios,
    registos,
    caixa,
    movimentos,
    apanhas,
    metas,
    valorReceber,
    precoPeixe,
    precoPeixePorUtilizador,
    savePrecoPeixe,
    cicloInicio,
    cicloPorUtilizador,
    loadData,
    saveRegistos,
    saveCaixa,
    saveMovimentos,
    saveUsuarios,
    saveMetas,
    saveValorReceber,
    marcarPago,
    showToast,
    showConfirm,
    isLight,
  } = useApp()

  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroFunc, setFiltroFunc] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [valorCaixaTotal, setValorCaixaTotal] = useState('')
  const [respCaixa, setRespCaixa] = useState('')
  const [tipoMovimento, setTipoMovimento] = useState('Depósito')
  const [valorMovimento, setValorMovimento] = useState('')
  const [motivoMovimento, setMotivoMovimento] = useState('')
  const [userNome, setUserNome] = useState('')
  const [userCargo, setUserCargo] = useState('funcionario')
  const [userGrupo, setUserGrupo] = useState('')
  const [userFivemNick, setUserFivemNick] = useState('')
  const [userTelemovel, setUserTelemovel] = useState('')
  const [userPin, setUserPin] = useState('')
  const [editingUserIndex, setEditingUserIndex] = useState(null)
  const [filtroUtilizadorApanhas, setFiltroUtilizadorApanhas] = useState('')
  const [filtroDataInicioApanhas, setFiltroDataInicioApanhas] = useState('')
  const [filtroDataFimApanhas, setFiltroDataFimApanhas] = useState('')
  const [metasPorUser, setMetasPorUser] = useState({})
  const [valorReceberPorUser, setValorReceberPorUser] = useState({})
  const [metaPorGrupo, setMetaPorGrupo] = useState({})
  const [metasSaving, setMetasSaving] = useState(false)
  const [precoSemInput, setPrecoSemInput] = useState('')
  const [precoParceriaInput, setPrecoParceriaInput] = useState('')
  const [precoPeixeSaving, setPrecoPeixeSaving] = useState(false)
  const [precoPorUserEdit, setPrecoPorUserEdit] = useState({}) // { [userId]: { sem: string, parceria: string } }
  const [precoPorUserSaving, setPrecoPorUserSaving] = useState(false)
  const [pagoSavingUserId, setPagoSavingUserId] = useState(null)
  const [filtroPagUtilizador, setFiltroPagUtilizador] = useState('')
  const [filtroPagDataInicio, setFiltroPagDataInicio] = useState('')
  const [filtroPagDataFim, setFiltroPagDataFim] = useState('')
  const [filtroPagValorMin, setFiltroPagValorMin] = useState('')
  const [filtroPagValorMax, setFiltroPagValorMax] = useState('')
  const [filtroPagAprovadoPor, setFiltroPagAprovadoPor] = useState('')
  const [showUserFormModal, setShowUserFormModal] = useState(false)

  const closeUserFormModal = useCallback(() => {
    setShowUserFormModal(false)
    setEditingUserIndex(null)
    setUserNome('')
    setUserCargo('funcionario')
    setUserGrupo('')
    setUserFivemNick('')
    setUserTelemovel('')
    setUserPin('')
  }, [])

  useEffect(() => {
    if (activeSubtab === 'caixa') setValorCaixaTotal(caixa != null ? String(caixa) : '')
  }, [activeSubtab, caixa])

  useEffect(() => {
    if (activeSubtab !== 'metas') return
    const userMetas = {}
    const groupMetas = {}
    for (const m of Array.isArray(metas) ? metas : []) {
      if (m.userId != null) userMetas[String(m.userId)] = m.meta
      if (m.grupo != null) groupMetas[m.grupo] = m.meta
    }
    setMetasPorUser(userMetas)
    setMetaPorGrupo(groupMetas)
    setValorReceberPorUser(typeof valorReceber === 'object' && valorReceber && !Array.isArray(valorReceber) ? { ...valorReceber } : {})
    setPrecoSemInput(precoPeixe?.sem != null ? String(precoPeixe.sem) : '36')
    setPrecoParceriaInput(precoPeixe?.parceria != null ? String(precoPeixe.parceria) : '38')
    const edit = {}
    for (const u of usuarios || []) {
      const id = String(u.id)
      const val = precoPeixePorUtilizador?.[id]
      const num = typeof val === 'number' ? val : (precoPeixe?.sem != null ? precoPeixe.sem : 36)
      edit[id] = String(num)
    }
    setPrecoPorUserEdit(edit)
  }, [activeSubtab, metas, valorReceber, precoPeixe, precoPeixePorUtilizador, usuarios])

  const registosFiltrados = useMemo(() => {
    return (registos || []).filter((r) => {
      if (filtroTipo && r.tipo !== filtroTipo) return false
      if (filtroFunc && r.funcionario !== filtroFunc) return false
      const d = parseDataRegisto(r.data)
      if (filtroDataInicio && d && d < new Date(filtroDataInicio + 'T00:00:00')) return false
      if (filtroDataFim && d && d > new Date(filtroDataFim + 'T23:59:59')) return false
      return true
    })
  }, [registos, filtroTipo, filtroFunc, filtroDataInicio, filtroDataFim])

  const handleApagarRegisto = async (index) => {
    const origIndex = registos.indexOf(registosFiltrados[index])
    if (origIndex < 0) return
    const novo = registos.filter((_, i) => i !== origIndex)
    try {
      await saveRegistos(novo)
      showToast('Registo removido.', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    }
  }

  const handleGuardarCaixaTotal = async () => {
    const v = Number(valorCaixaTotal)
    if (isNaN(v)) {
      showToast('Valor inválido para caixa.', 'error')
      return
    }
    try {
      await saveCaixa(v)
      showToast('Valor total de caixa guardado.', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    }
  }

  const handleRegistarMovimento = async (e) => {
    e.preventDefault()
    if (!respCaixa || !tipoMovimento || !valorMovimento || !motivoMovimento) {
      showToast('Preencha todos os campos do movimento.', 'error')
      return
    }
    const v = Number(valorMovimento)
    if (isNaN(v) || v <= 0) {
      showToast('Valor inválido.', 'error')
      return
    }
    const novo = [
      ...movimentos,
      {
        resp: respCaixa,
        tipo: tipoMovimento,
        valor: v,
        motivo: motivoMovimento,
        data: new Date().toLocaleString('pt-PT'),
      },
    ]
    try {
      await saveMovimentos(novo)
      setRespCaixa('')
      setTipoMovimento('Depósito')
      setValorMovimento('')
      setMotivoMovimento('')
      showToast('Movimento de caixa registado.', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    }
  }

  const handleApagarMovimento = async (index) => {
    const novo = movimentos.filter((_, i) => i !== index)
    try {
      await saveMovimentos(novo)
      showToast('Movimento removido.', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    }
  }

  useEffect(() => {
    if (!showUserFormModal) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowUserFormModal(false)
        setEditingUserIndex(null)
        setUserNome('')
        setUserCargo('funcionario')
        setUserGrupo('')
        setUserFivemNick('')
        setUserTelemovel('')
        setUserPin('')
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showUserFormModal])

  const handleAddUser = async (e) => {
    e.preventDefault()
    const nome = userNome.trim()
    const pin = userPin.trim()
    if (!nome || !userCargo || !pin) {
      showToast('Preencha todos os campos obrigatórios do utilizador.', 'error')
      return
    }
    const u = {
      id: editingUserIndex !== null ? usuarios[editingUserIndex].id : Date.now(),
      nome,
      cargo: userCargo,
      grupo: userGrupo || undefined,
      fivem_nick: userFivemNick.trim() || undefined,
      telemovel: userTelemovel.trim() || undefined,
      pin,
    }
    let novo
    if (editingUserIndex !== null) {
      novo = [...usuarios]
      novo[editingUserIndex] = u
      setEditingUserIndex(null)
      showToast('Utilizador atualizado com sucesso.', 'success')
    } else {
      novo = [...usuarios, u]
      showToast('Utilizador adicionado com sucesso.', 'success')
    }
    try {
      await saveUsuarios(novo)
      closeUserFormModal()
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    }
  }

  const handleEditarUser = (i) => {
    const u = usuarios[i]
    setUserNome(u.nome)
    setUserCargo(u.cargo || 'funcionario')
    setUserGrupo(u.grupo || '')
    setUserFivemNick(u.fivem_nick || '')
    setUserTelemovel(u.telemovel || '')
    setUserPin(u.pin || '')
    setEditingUserIndex(i)
    setShowUserFormModal(true)
  }

  const handleCancelarEdicao = () => {
    setEditingUserIndex(null)
    setUserNome('')
    setUserCargo('funcionario')
    setUserGrupo('')
    setUserFivemNick('')
    setUserTelemovel('')
    setUserPin('')
  }

  const handleApagarUser = async (i) => {
    const novo = usuarios.filter((_, idx) => idx !== i)
    try {
      await saveUsuarios(novo)
      showToast('Utilizador removido.', 'success')
      if (editingUserIndex === i) closeUserFormModal()
      else if (editingUserIndex > i) setEditingUserIndex((prev) => prev - 1)
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    }
  }

  const handleGuardarMetas = async () => {
    setMetasSaving(true)
    try {
      const metasArray = []
      for (const u of usuarios || []) {
        const id = u.id
        const meta = metasPorUser[String(id)]
        if (meta != null && meta !== '' && !Number.isNaN(Number(meta))) {
          metasArray.push({ userId: id, meta: Number(meta) })
        }
      }
      const grupos = ['A', 'B', 'C', 'D', 'E', 'F']
      for (const g of grupos) {
        const meta = metaPorGrupo[g]
        if (meta != null && meta !== '' && !Number.isNaN(Number(meta))) {
          metasArray.push({ grupo: g, meta: Number(meta) })
        }
      }
      await saveMetas(metasArray)
      showToast('Metas guardadas.', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    } finally {
      setMetasSaving(false)
    }
  }

  const handleGuardarPrecoPeixe = async () => {
    const sem = Number(precoSemInput)
    const parceria = Number(precoParceriaInput)
    if (Number.isNaN(sem) || Number.isNaN(parceria) || sem < 0 || parceria < 0) {
      showToast('Valores do peixe inválidos.', 'error')
      return
    }
    setPrecoPeixeSaving(true)
    try {
      await savePrecoPeixe({ sem, parceria })
      showToast('Preços do peixe guardados.', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    } finally {
      setPrecoPeixeSaving(false)
    }
  }

  const valorReceberCalculadoPorUser = useMemo(() => {
    const globalPreco = Number(precoPeixe?.sem) || 0
    const out = {}
    const list = apanhas || []
    for (const u of usuarios || []) {
      const id = u.id
      const idKey = String(id)
      const precoPorPeixe = typeof precoPeixePorUtilizador?.[idKey] === 'number' ? precoPeixePorUtilizador[idKey] : globalPreco
      const entry = cicloPorUtilizador?.[idKey]
      const cicloStr = typeof entry === 'string' ? entry : (entry?.data ?? null)
      const cicloStrResolved = cicloStr ?? cicloInicio
      if (!cicloStrResolved) {
        out[id] = 0
        continue
      }
      const cicloStart = new Date(cicloStrResolved)
      const total = list.reduce((acc, a) => {
        if (String(a.user_id) !== idKey) return acc
        const d = a.datahora ? new Date(a.datahora) : null
        if (!d || d < cicloStart) return acc
        const quantidade = Number(a.quantidade) || 0
        return acc + quantidade * precoPorPeixe
      }, 0)
      out[id] = total
    }
    return out
  }, [usuarios, apanhas, cicloInicio, cicloPorUtilizador, precoPeixe, precoPeixePorUtilizador])

  const handleGuardarPrecoPorJogador = async () => {
    const porUtilizador = {}
    for (const [uid, val] of Object.entries(precoPorUserEdit)) {
      const num = Number(val)
      if (!Number.isNaN(num) && num >= 0) {
        porUtilizador[uid] = num
      }
    }
    setPrecoPorUserSaving(true)
    try {
      await savePrecoPeixe({
        sem: precoPeixe?.sem ?? 36,
        parceria: precoPeixe?.parceria ?? 38,
        porUtilizador
      })
      showToast('Valor por peixe (pagamento ao jogador) guardado.', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    } finally {
      setPrecoPorUserSaving(false)
    }
  }

  const handleMarcarPagoUser = (userId, nome, valor) => {
    showConfirm({
      title: 'Confirmar pagamento',
      message: `Marcar ${nome || 'este utilizador'} como pago? O ciclo deste jogador será reiniciado e a meta removida.`,
      variant: 'default',
      onConfirm: async () => {
        setPagoSavingUserId(userId)
        try {
          await marcarPago(userId, {
            aprovadoPor: user?.nome || null,
            valor: valor != null ? valor : null
          })
          await loadData()
          showToast('Pagamento marcado como efetuado para este jogador.', 'success')
        } catch {
          showToast('Erro ao marcar pagamento.', 'error')
        } finally {
          setPagoSavingUserId(null)
        }
      }
    })
  }

  const apanhasAdmin = useMemo(() => {
    const users = filtroUtilizadorApanhas
      ? usuarios.filter((u) => String(u.id) === String(filtroUtilizadorApanhas))
      : usuarios
    const result = []
    for (const u of users) {
      const list = (apanhas || []).filter((a) => Number(a.user_id) === Number(u.id))
      let filtered = list
      if (filtroDataInicioApanhas || filtroDataFimApanhas) {
        filtered = list.filter((a) => {
          const d = a.datahora ? new Date(a.datahora) : null
          if (!d) return true
          if (filtroDataInicioApanhas && d < new Date(filtroDataInicioApanhas + 'T00:00:00'))
            return false
          if (filtroDataFimApanhas && d > new Date(filtroDataFimApanhas + 'T23:59:59')) return false
          return true
        })
      }
      const total = filtered.reduce((s, a) => s + (Number(a.quantidade) || 0), 0)
      result.push({ user: u, total, list: filtered.sort((a, b) => new Date(b.datahora || 0) - new Date(a.datahora || 0)) })
    }
    return result.sort((a, b) => b.total - a.total)
  }, [usuarios, apanhas, filtroUtilizadorApanhas, filtroDataInicioApanhas, filtroDataFimApanhas])

  const tableClass = 'w-full text-sm border-collapse min-w-[600px]'
  const thClass = isLight
    ? 'border border-slate-300 bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-700'
    : 'border border-slate-600 bg-slate-800/90 px-2 py-1.5 text-left font-medium'
  const tdClass = isLight ? 'border border-slate-200 px-2 py-1.5 text-slate-700' : 'border border-slate-600 px-2 py-1.5'
  const wrapperClass = isLight ? 'rounded-xl border border-slate-300 bg-slate-50 overflow-x-touch' : 'rounded-xl border border-slate-600 overflow-x-touch'
  const filterWrapperClass = isLight ? 'flex flex-wrap items-center gap-4 mb-4 p-3 rounded-xl border border-slate-300 bg-slate-50' : 'flex flex-wrap items-center gap-4 mb-4 p-3 rounded-xl border border-slate-600 bg-slate-800/50'
  const labelClass = isLight ? 'text-xs uppercase tracking-wider text-slate-600' : 'text-xs uppercase tracking-wider text-slate-500'
  const labelBlockClass = isLight ? 'block text-xs font-medium uppercase tracking-wider text-slate-600' : 'block text-xs font-medium uppercase tracking-wider text-slate-500'
  const btnDeleteClass = isLight ? 'text-red-600 hover:text-red-700' : 'text-red-400 hover:text-red-300'
  const btnEditClass = isLight ? 'text-sky-600 hover:text-sky-700 mr-2' : 'text-sky-400 hover:text-sky-300 mr-2'
  const mutedTextClass = isLight ? 'text-sm text-slate-600 mb-2' : 'text-sm text-slate-500 mb-2'
  const mutedTextClassMb4 = isLight ? 'text-sm text-slate-600 mb-4' : 'text-sm text-slate-500 mb-4'
  const emptyTdClass = isLight ? `${tdClass} text-center text-slate-600` : `${tdClass} text-center text-slate-500`
  const borderTrClass = isLight ? 'border-t-2 border-slate-300' : 'border-t-2 border-slate-600'
  const btnCancelClass = isLight
    ? 'rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100'
    : 'rounded-full border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30'

  return (
    <>
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mt-0 mb-4">Administração</h2>
      <button
        type="button"
        onClick={() => loadData()}
        className="btn-primary inline-flex items-center gap-2 mb-4"
      >
        <RefreshCw className="h-4 w-4" />
        Atualizar dados
      </button>

      <div className={`flex flex-wrap border-b mb-4 -mx-1 gap-1 ${isLight ? 'border-slate-200' : 'border-slate-600'}`}>
        {SUBTABS.map(({ id, label }) => {
          const active = activeSubtab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSubtab(id)}
              className={`min-h-[44px] px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px rounded-t-lg ${
                active
                  ? isLight
                    ? 'border-sky-500 text-sky-600 bg-sky-50/50'
                    : 'border-sky-500 text-sky-400 bg-sky-500/10'
                  : isLight
                    ? 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {activeSubtab === 'relatorios' && (
        <>
          <h3 className="text-base font-semibold mb-2">Registos de Vendas e Compras</h3>
          <div className={filterWrapperClass}>
            <label className={labelClass}>Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="glass-input w-auto min-w-[120px] py-2"
            >
              <option value="">Todos</option>
              <option value="venda">Venda</option>
              <option value="compra">Compra</option>
            </select>
            <label className={labelClass}>Funcionário</label>
            <select
              value={filtroFunc}
              onChange={(e) => setFiltroFunc(e.target.value)}
              className="glass-input w-auto min-w-[120px] py-2"
            >
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id ?? u.nome} value={u.nome}>
                  {u.nome}
                </option>
              ))}
            </select>
            <label className={labelClass}>Data inicial</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="glass-input w-auto min-w-[120px] py-2"
            />
            <label className={labelClass}>Data final</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="glass-input w-auto min-w-[120px] py-2"
            />
          </div>
          {registosFiltrados.length === 0 ? (
            <p className={mutedTextClass}>Nenhum registo encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {registosFiltrados.map((r, i) => {
                  const origIndex = registos.indexOf(r)
                  return (
                    <div
                      key={origIndex}
                      className={`rounded-xl border p-4 space-y-2 ${
                        isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-600 bg-slate-800/50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}>{r.tipo}</span>
                        <span className={isLight ? 'text-slate-800 font-semibold' : 'text-slate-200'}>{Number(r.valor).toFixed(2)} €</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <span className={labelClass}>Funcionário</span>
                        <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{r.funcionario}</span>
                        <span className={labelClass}>Entidade</span>
                        <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{r.entidade}</span>
                        <span className={labelClass}>Qtd</span>
                        <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{r.qtd}</span>
                        <span className={labelClass}>Data</span>
                        <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{r.data}</span>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleApagarRegisto(i)}
                          className={`min-h-[44px] px-3 rounded-lg text-sm font-medium ${btnDeleteClass}`}
                          aria-label="Apagar"
                        >
                          <Trash2 className="h-4 w-4 inline mr-1" />
                          Apagar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className={`hidden md:block ${wrapperClass}`}>
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>Tipo</th>
                      <th className={thClass}>Funcionário</th>
                      <th className={thClass}>Entidade</th>
                      <th className={thClass}>Qtd</th>
                      <th className={thClass}>Valor (€)</th>
                      <th className={thClass}>Data</th>
                      <th className={thClass}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registosFiltrados.map((r, i) => {
                      const origIndex = registos.indexOf(r)
                      return (
                        <tr key={origIndex}>
                          <td className={tdClass}>{r.tipo}</td>
                          <td className={tdClass}>{r.funcionario}</td>
                          <td className={tdClass}>{r.entidade}</td>
                          <td className={tdClass}>{r.qtd}</td>
                          <td className={tdClass}>{Number(r.valor).toFixed(2)} €</td>
                          <td className={tdClass}>{r.data}</td>
                          <td className={tdClass}>
                            <button
                              type="button"
                              onClick={() => handleApagarRegisto(i)}
                              className={`${btnDeleteClass} min-h-[44px] inline-flex items-center`}
                              aria-label="Apagar"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {activeSubtab === 'caixa' && (
        <>
          <h3 className="text-base font-semibold mb-2">Caixa da Empresa</h3>
          <label className={labelBlockClass}>
            Valor total em caixa (€)
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={valorCaixaTotal}
            onChange={(e) => setValorCaixaTotal(e.target.value)}
            className="glass-input mt-2 max-w-xs"
          />
          <button
            type="button"
            onClick={handleGuardarCaixaTotal}
            className="btn-primary inline-flex items-center gap-2 mt-2"
          >
            <Save className="h-4 w-4" />
            Guardar valor total
          </button>

          <h3 className="text-base font-semibold mt-6 mb-2">Registar Movimento</h3>
          <form onSubmit={handleRegistarMovimento} className="space-y-4 max-w-md">
            <div>
              <label className={labelBlockClass}>
                Responsável
              </label>
              <select
                value={respCaixa}
                onChange={(e) => setRespCaixa(e.target.value)}
                className="glass-input mt-2"
              >
                <option value="">—</option>
                {usuarios.map((u) => (
                  <option key={u.id ?? u.nome} value={u.nome}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelBlockClass}>
                Tipo de movimento
              </label>
              <select
                value={tipoMovimento}
                onChange={(e) => setTipoMovimento(e.target.value)}
                className="glass-input mt-2"
              >
                <option value="Depósito">Depósito</option>
                <option value="Retirada">Retirada</option>
              </select>
            </div>
            <div>
              <label className={labelBlockClass}>
                Valor (€)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={valorMovimento}
                onChange={(e) => setValorMovimento(e.target.value)}
                className="glass-input mt-2"
              />
            </div>
            <div>
              <label className={labelBlockClass}>
                Motivo
              </label>
              <input
                value={motivoMovimento}
                onChange={(e) => setMotivoMovimento(e.target.value)}
                className="glass-input mt-2"
              />
            </div>
            <button type="submit" className="btn-primary inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Guardar Movimento
            </button>
          </form>

          <h3 className="text-base font-semibold mt-6 mb-2">Movimentos de Caixa</h3>
          <div className={wrapperClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Responsável</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Valor (€)</th>
                  <th className={thClass}>Motivo</th>
                  <th className={thClass}>Data</th>
                  <th className={thClass}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {(movimentos || []).map((m, i) => (
                  <tr key={i}>
                    <td className={tdClass}>{m.resp}</td>
                    <td className={tdClass}>{m.tipo}</td>
                    <td className={tdClass}>{Number(m.valor).toFixed(2)} €</td>
                    <td className={tdClass}>{m.motivo}</td>
                    <td className={tdClass}>{m.data}</td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() => handleApagarMovimento(i)}
                        className={btnDeleteClass}
                        aria-label="Apagar"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeSubtab === 'utilizadores' && (
        <>
          <h3 className="text-base font-semibold mb-2">Lista de Utilizadores</h3>
          <div className={wrapperClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Nome</th>
                  <th className={thClass}>Cargo</th>
                  <th className={thClass}>Grupo</th>
                  <th className={thClass}>Nick FiveM</th>
                  <th className={thClass}>Telemóvel</th>
                  <th className={thClass}>PIN</th>
                  <th className={thClass}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {(usuarios || []).map((u, i) => (
                  <tr key={u.id ?? i}>
                    <td className={tdClass}>{u.nome}</td>
                    <td className={tdClass}>{u.cargo}</td>
                    <td className={tdClass}>{u.grupo || '—'}</td>
                    <td className={tdClass}>{u.fivem_nick || '—'}</td>
                    <td className={tdClass}>{u.telemovel || '—'}</td>
                    <td className={tdClass}>{u.pin ? '•'.repeat(u.pin.length) : ''}</td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() => handleEditarUser(i)}
                        className={btnEditClass}
                        aria-label="Editar"
                      >
                        <Edit className="h-4 w-4 inline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApagarUser(i)}
                        className={btnDeleteClass}
                        aria-label="Apagar"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => {
              handleCancelarEdicao()
              setShowUserFormModal(true)
            }}
            className="btn-primary inline-flex items-center gap-2 mt-4"
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Utilizador
          </button>
        </>
      )}

      {activeSubtab === 'pagamentos' && (
        <>
          <h3 className="text-base font-semibold mb-2">Histórico de Pagamentos</h3>
          <div className={filterWrapperClass}>
            <label className={labelClass}>Utilizador</label>
            <input
              type="text"
              value={filtroPagUtilizador}
              onChange={(e) => setFiltroPagUtilizador(e.target.value)}
              placeholder="Filtrar por nome"
              className="glass-input w-auto min-w-[120px] py-2"
            />
            <label className={labelClass}>Data inicial</label>
            <input
              type="date"
              value={filtroPagDataInicio}
              onChange={(e) => setFiltroPagDataInicio(e.target.value)}
              className="glass-input w-auto min-w-[120px] py-2"
            />
            <label className={labelClass}>Data final</label>
            <input
              type="date"
              value={filtroPagDataFim}
              onChange={(e) => setFiltroPagDataFim(e.target.value)}
              className="glass-input w-auto min-w-[120px] py-2"
            />
            <label className={labelClass}>Valor mín. (€)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={filtroPagValorMin}
              onChange={(e) => setFiltroPagValorMin(e.target.value)}
              placeholder="0"
              className="glass-input w-auto min-w-[80px] py-2"
            />
            <label className={labelClass}>Valor máx. (€)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={filtroPagValorMax}
              onChange={(e) => setFiltroPagValorMax(e.target.value)}
              placeholder="—"
              className="glass-input w-auto min-w-[80px] py-2"
            />
            <label className={labelClass}>Aprovado por</label>
            <input
              type="text"
              value={filtroPagAprovadoPor}
              onChange={(e) => setFiltroPagAprovadoPor(e.target.value)}
              placeholder="Filtrar por nome"
              className="glass-input w-auto min-w-[120px] py-2"
            />
          </div>
          <div className={wrapperClass}>
            {(() => {
              const pagamentosBrutos = (usuarios || [])
                .filter((u) => cicloPorUtilizador && cicloPorUtilizador[u.id])
                .map((u) => {
                  const entry = cicloPorUtilizador[u.id]
                  const dataIso = typeof entry === 'string' ? entry : (entry?.data ?? null)
                  if (!dataIso) return null
                  return {
                    nome: u.nome,
                    data: new Date(dataIso).toLocaleDateString('pt-PT'),
                    timestamp: new Date(dataIso).getTime(),
                    aprovadoPor: typeof entry === 'object' ? (entry.aprovadoPor ?? '—') : '—',
                    valor: typeof entry === 'object' && entry.valor != null ? entry.valor : null,
                  }
                })
                .filter(Boolean)
                .sort((a, b) => b.timestamp - a.timestamp)
              const pagamentos = pagamentosBrutos.filter((p) => {
                const fUtil = filtroPagUtilizador.trim().toLowerCase()
                if (fUtil && !p.nome.toLowerCase().includes(fUtil)) return false
                if (filtroPagDataInicio) {
                  const dInicio = new Date(filtroPagDataInicio + 'T00:00:00').getTime()
                  if (p.timestamp < dInicio) return false
                }
                if (filtroPagDataFim) {
                  const dFim = new Date(filtroPagDataFim + 'T23:59:59').getTime()
                  if (p.timestamp > dFim) return false
                }
                const val = p.valor != null ? p.valor : 0
                const fMin = filtroPagValorMin !== '' && !Number.isNaN(Number(filtroPagValorMin)) ? Number(filtroPagValorMin) : null
                if (fMin != null && val < fMin) return false
                const fMax = filtroPagValorMax !== '' && !Number.isNaN(Number(filtroPagValorMax)) ? Number(filtroPagValorMax) : null
                if (fMax != null && val > fMax) return false
                const fAprov = filtroPagAprovadoPor.trim().toLowerCase()
                if (fAprov && !String(p.aprovadoPor || '').toLowerCase().includes(fAprov)) return false
                return true
              })
              if (pagamentosBrutos.length === 0) {
                return (
                  <p className={mutedTextClass}>
                    Não há pagamentos registados.
                  </p>
                )
              }
              if (pagamentos.length === 0) {
                return (
                  <p className={mutedTextClass}>
                    Nenhum resultado para os filtros aplicados.
                  </p>
                )
              }
              return (
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>Utilizador</th>
                      <th className={thClass}>Data do pagamento</th>
                      <th className={thClass}>Valor (€)</th>
                      <th className={thClass}>Aprovado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((p, i) => (
                      <tr key={i}>
                        <td className={tdClass}>{p.nome}</td>
                        <td className={tdClass}>{p.data}</td>
                        <td className={tdClass}>{p.valor != null ? `${Number(p.valor).toFixed(2)} €` : '—'}</td>
                        <td className={tdClass}>{p.aprovadoPor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            })()}
          </div>
        </>
      )}

      {activeSubtab === 'metas' && (
        <>
          <h3 className="text-base font-semibold mb-2">Preços de venda (Calculadora e Compras)</h3>
          <p className={mutedTextClass}>
            Valores por peixe para vendas a outros — usados na Calculadora e no registo de Compras. Não confundir com o valor por jogador (pagamento), definido na tabela abaixo.
          </p>
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className={`${labelClass} mb-1`}>Sem parceria (€/peixe)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={precoSemInput}
                onChange={(e) => setPrecoSemInput(e.target.value)}
                className="glass-input py-2 w-28"
                placeholder="36"
              />
            </div>
            <div>
              <label className={`${labelClass} mb-1`}>Em parceria (€/peixe)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={precoParceriaInput}
                onChange={(e) => setPrecoParceriaInput(e.target.value)}
                className="glass-input py-2 w-28"
                placeholder="38"
              />
            </div>
            <button
              type="button"
              onClick={handleGuardarPrecoPeixe}
              disabled={precoPeixeSaving}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {precoPeixeSaving ? 'A guardar…' : 'Guardar preços'}
            </button>
          </div>

          <h3 className="text-base font-semibold mb-2 mt-8">Metas, pagamento ao jogador e ciclos</h3>
          <p className={mutedTextClassMb4}>
            Meta semanal por utilizador e por equipa. A coluna €/peixe define quanto a administração paga por peixe a cada jogador (valor a receber = quantidade × esse valor). Marque como pago por jogador para reiniciar o ciclo.
          </p>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {['A', 'B', 'C', 'D', 'E', 'F'].map((g) => (
              <div key={g}>
                <label className={`${labelClass} mb-1`}>Meta equipa {g}</label>
                <input
                  type="number"
                  min={0}
                  value={metaPorGrupo[g] ?? ''}
                  onChange={(e) => setMetaPorGrupo((prev) => ({ ...prev, [g]: e.target.value }))}
                  className="glass-input py-2"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className={`${wrapperClass} mb-4`}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Nome</th>
                  <th className={thClass}>Grupo</th>
                  <th className={thClass}>Meta semanal</th>
                  <th className={thClass}>€/peixe (pagamento ao jogador)</th>
                  <th className={thClass}>Valor a receber (€)</th>
                  <th className={thClass}>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {(usuarios || []).map((u) => (
                  <tr key={u.id ?? u.nome}>
                    <td className={tdClass}>{u.nome}</td>
                    <td className={tdClass}>{u.grupo || '—'}</td>
                    <td className={tdClass}>
                      <input
                        type="number"
                        min={0}
                        className="glass-input py-1.5 w-24 text-sm"
                        value={metasPorUser[String(u.id)] ?? ''}
                        onChange={(e) =>
                          setMetasPorUser((prev) => ({ ...prev, [String(u.id)]: e.target.value }))
                        }
                        placeholder="0"
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="glass-input py-1.5 w-24 text-sm"
                        value={precoPorUserEdit[String(u.id)] ?? ''}
                        onChange={(e) =>
                          setPrecoPorUserEdit((prev) => ({ ...prev, [String(u.id)]: e.target.value }))
                        }
                        placeholder={String(precoPeixe?.sem ?? 36)}
                      />
                    </td>
                    <td className={tdClass}>
                      {(valorReceberCalculadoPorUser[u.id] ?? 0).toFixed(2)} €
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() => handleMarcarPagoUser(u.id, u.nome, valorReceberCalculadoPorUser[u.id] ?? 0)}
                        disabled={pagoSavingUserId !== null}
                        className={isLight ? 'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/70 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50' : 'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/70 bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50'}
                      >
                        <Banknote className="h-3.5 w-3.5" />
                        {pagoSavingUserId === u.id ? 'A processar…' : 'Marcar como pago'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGuardarMetas}
              disabled={metasSaving}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {metasSaving ? 'A guardar…' : 'Guardar metas'}
            </button>
            <button
              type="button"
              onClick={handleGuardarPrecoPorJogador}
              disabled={precoPorUserSaving}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {precoPorUserSaving ? 'A guardar…' : 'Guardar preços por jogador'}
            </button>
          </div>
        </>
      )}

      {activeSubtab === 'apanhas' && (
        <>
          <h3 className="text-base font-semibold mb-2">Apanhas de Peixe por Utilizador</h3>
          <div className={filterWrapperClass}>
            <label className={labelClass}>Utilizador</label>
            <select
              value={filtroUtilizadorApanhas}
              onChange={(e) => setFiltroUtilizadorApanhas(e.target.value)}
              className="glass-input w-auto min-w-[180px] py-2"
            >
              <option value="">Todos os utilizadores</option>
              {usuarios.map((u) => (
                <option key={u.id ?? u.nome} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
            <label className={labelClass}>Data inicial</label>
            <input
              type="date"
              value={filtroDataInicioApanhas}
              onChange={(e) => setFiltroDataInicioApanhas(e.target.value)}
              className="glass-input w-auto min-w-[120px] py-2"
            />
            <label className={labelClass}>Data final</label>
            <input
              type="date"
              value={filtroDataFimApanhas}
              onChange={(e) => setFiltroDataFimApanhas(e.target.value)}
              className="glass-input w-auto min-w-[120px] py-2"
            />
          </div>
          <h4 className="text-sm font-semibold mt-4 mb-2">Totais por Utilizador</h4>
          <div className={`${wrapperClass} mb-6`}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Utilizador</th>
                  <th className={thClass}>Total de Peixes</th>
                </tr>
              </thead>
              <tbody>
                {apanhasAdmin.length === 0 ? (
                  <tr>
                    <td colSpan={2} className={emptyTdClass}>
                      Nenhuma apanha registada.
                    </td>
                  </tr>
                ) : (
                  apanhasAdmin.map(({ user: u, total }) => (
                    <tr key={u.id}>
                      <td className={tdClass}>{u.nome}</td>
                      <td className={tdClass}>
                        <strong>{total}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <h4 className="text-sm font-semibold mb-2">Registos detalhados</h4>
          <div className={wrapperClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Utilizador</th>
                  <th className={thClass}>Quantidade</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Data e Hora</th>
                </tr>
              </thead>
              <tbody>
                {apanhasAdmin.flatMap(({ user: u, list }) =>
                  list.map((a) => (
                    <tr key={a.id}>
                      <td className={tdClass}>{u.nome}</td>
                      <td className={tdClass}>
                        <strong>{a.quantidade}</strong>
                      </td>
                      <td className={tdClass}>{a.tipo === 'parceria' ? 'Parceria' : 'Sem'}</td>
                      <td className={tdClass}>
                        {a.datahora ? new Date(a.datahora).toLocaleString('pt-PT') : '—'}
                      </td>
                    </tr>
                  ))
                )}
                {apanhasAdmin.length > 0 && (
                  <tr className={borderTrClass}>
                    <td className={`${tdClass} font-bold`}>Total geral</td>
                    <td className={`${tdClass} font-bold`}>
                      {apanhasAdmin.reduce((s, { total }) => s + total, 0)}
                    </td>
                    <td className={tdClass} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showUserFormModal && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-form-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeUserFormModal}
            aria-hidden
          />
          <div className={`glass-panel relative z-10 w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-4 sm:mx-0 p-6 shadow-2xl ${isLight ? 'border-slate-200' : 'border-slate-600/60'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="user-form-modal-title" className={`text-lg font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {editingUserIndex !== null ? 'Editar Utilizador' : 'Adicionar Utilizador'}
              </h2>
              <button
                type="button"
                onClick={closeUserFormModal}
                className={`p-1 rounded-lg transition ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'}`}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className={labelBlockClass}>Nome</label>
                <input
                  value={userNome}
                  onChange={(e) => setUserNome(e.target.value)}
                  className="glass-input mt-2"
                />
              </div>
              <div>
                <label className={labelBlockClass}>Cargo</label>
                <select
                  value={userCargo}
                  onChange={(e) => setUserCargo(e.target.value)}
                  className="glass-input mt-2"
                >
                  <option value="funcionario">Funcionário</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="gestor">Gestor</option>
                  <option value="direcao">Direção</option>
                </select>
              </div>
              <div>
                <label className={labelBlockClass}>Grupo</label>
                <select
                  value={userGrupo}
                  onChange={(e) => setUserGrupo(e.target.value)}
                  className="glass-input mt-2"
                >
                  <option value="">(opcional)</option>
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelBlockClass}>Nick FiveM</label>
                <input
                  value={userFivemNick}
                  onChange={(e) => setUserFivemNick(e.target.value)}
                  placeholder="Nome in-game no FiveM (opcional)"
                  className="glass-input mt-2"
                />
              </div>
              <div>
                <label className={labelBlockClass}>Telemóvel</label>
                <input
                  type="tel"
                  value={userTelemovel}
                  onChange={(e) => setUserTelemovel(e.target.value)}
                  placeholder="Ex: 912345678"
                  className="glass-input mt-2"
                />
              </div>
              <div>
                <label className={labelBlockClass}>PIN</label>
                <input
                  type="password"
                  value={userPin}
                  onChange={(e) => setUserPin(e.target.value)}
                  className="glass-input mt-2"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary inline-flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {editingUserIndex !== null ? 'Salvar Alterações' : 'Adicionar Utilizador'}
                </button>
                <button
                  type="button"
                  onClick={closeUserFormModal}
                  className={btnCancelClass}
                >
                  <X className="h-4 w-4 inline mr-1" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  )
}
