import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useApp } from '../context/AppContext'

// Parse dd/mm/yyyy or dd/mm/yyyy, hh:mm
function parseDataRegisto(str) {
  if (!str) return null
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
}

function getWeekKey(d) {
  const date = d instanceof Date ? d : new Date(d)
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay() + 1)
  return start.toISOString().slice(0, 10)
}

function getMonthKey(d) {
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Aggregate registos by week or month
function aggregateRegistosByPeriod(registos, tipo, period = 'week') {
  const getKey = period === 'week' ? getWeekKey : getMonthKey
  const map = new Map()
  for (const r of registos || []) {
    if (r.tipo !== tipo) continue
    const d = parseDataRegisto(r.data)
    if (!d) continue
    const key = getKey(d)
    const prev = map.get(key) || 0
    map.set(key, prev + (Number(r.valor) || 0))
  }
  const keys = Array.from(map.keys()).sort()
  return keys.map((key) => ({ periodo: key, valor: map.get(key), total: map.get(key) }))
}

const CHART_THEME = {
  dark: {
    gridStroke: '#475569',
    axisStroke: '#94a3b8',
    tickFill: '#94a3b8',
    tooltipBg: '#1e293b',
    tooltipBorder: '1px solid #475569',
    tooltipText: '#e2e8f0',
    tooltipLabel: '#94a3b8',
    chartWrapperClass: 'rounded-xl border border-slate-600 bg-slate-800/50 p-4',
    barMeta: '#64748b',
    barRealizado: '#38bdf8',
    lineVendas: '#38bdf8',
    lineCompras: '#f59e0b',
    legendText: '#94a3b8',
  },
  light: {
    gridStroke: '#cbd5e1',
    axisStroke: '#64748b',
    tickFill: '#475569',
    tooltipBg: '#f8fafc',
    tooltipBorder: '1px solid #e2e8f0',
    tooltipText: '#1e293b',
    tooltipLabel: '#475569',
    chartWrapperClass: 'rounded-xl border border-slate-300 bg-white/80 p-4',
    barMeta: '#94a3b8',
    barRealizado: '#0284c7',
    lineVendas: '#0284c7',
    lineCompras: '#d97706',
    legendText: '#475569',
  },
}

export default function ContentDashboard() {
  const ctx = useApp()
  const {
    user,
    isLight,
    registos,
    apanhas,
    usuarios,
    loadData,
    tempoOnlineRank,
  } = ctx
  const metas = Array.isArray(ctx.metas) ? ctx.metas : []
  const precoPeixeGlobal = ctx.precoPeixe && typeof ctx.precoPeixe.sem === 'number' ? ctx.precoPeixe.sem : 36
  const precoPeixePorUtilizador = ctx.precoPeixePorUtilizador && typeof ctx.precoPeixePorUtilizador === 'object' ? ctx.precoPeixePorUtilizador : {}
  const userKey = user ? String(user.id) : ''
  const precoPagamentoJogador = (userKey && typeof precoPeixePorUtilizador[userKey] === 'number') ? precoPeixePorUtilizador[userKey] : precoPeixeGlobal
  const cicloInicio = ctx.cicloInicio
  const cicloPorUtilizador = ctx.cicloPorUtilizador && typeof ctx.cicloPorUtilizador === 'object' ? ctx.cicloPorUtilizador : {}

  const cargo = user?.cargo || ''
  const isGestor = cargo === 'gestor'
  const isDirecao = cargo === 'direcao' || cargo === 'gestor'
  const isSupervisor = cargo === 'supervisor'

  // Current week bounds
  const now = new Date()
  const weekStart = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay() + 1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 6)
    d.setHours(23, 59, 59, 999)
    return d
  }, [weekStart])

  const metaUser = useMemo(() => {
    if (!user || !Array.isArray(metas)) return null
    return metas.find((m) => String(m.userId) === String(user.id))?.meta ?? 0
  }, [user, metas])

  const valorReceberUser = useMemo(() => {
    if (!user || !userKey) return 0
    const cicloStartStr = cicloPorUtilizador[userKey] ?? cicloInicio
    if (!cicloStartStr) return 0
    const cicloStart = new Date(cicloStartStr)
    const precoPorPeixe = Number(precoPagamentoJogador) || 0
    return (apanhas || []).reduce((acc, a) => {
      if (String(a.user_id) !== userKey) return acc
      const d = a.datahora ? new Date(a.datahora) : null
      if (!d || d < cicloStart) return acc
      const quantidade = Number(a.quantidade) || 0
      return acc + quantidade * precoPorPeixe
    }, 0)
  }, [user, userKey, apanhas, cicloInicio, cicloPorUtilizador, precoPagamentoJogador])

  const pessoalApanhasSemana = useMemo(() => {
    if (!user) return 0
    return (apanhas || []).reduce((acc, a) => {
      if (Number(a.user_id) !== Number(user.id)) return acc
      const d = a.datahora ? new Date(a.datahora) : null
      if (!d || d < weekStart || d > weekEnd) return acc
      return acc + (Number(a.quantidade) || 0)
    }, 0)
  }, [user, apanhas, weekStart, weekEnd])

  const vendasPorPeriodo = useMemo(
    () => aggregateRegistosByPeriod(registos, 'venda', 'week'),
    [registos]
  )
  const comprasPorPeriodo = useMemo(
    () => aggregateRegistosByPeriod(registos, 'compra', 'week'),
    [registos]
  )
  const comprasVendasCombo = useMemo(() => {
    const keys = new Set([
      ...vendasPorPeriodo.map((x) => x.periodo),
      ...comprasPorPeriodo.map((x) => x.periodo),
    ])
    return Array.from(keys)
      .sort()
      .map((periodo) => ({
        periodo,
        vendas: vendasPorPeriodo.find((x) => x.periodo === periodo)?.valor ?? 0,
        compras: comprasPorPeriodo.find((x) => x.periodo === periodo)?.valor ?? 0,
      }))
  }, [vendasPorPeriodo, comprasPorPeriodo])

  const totalVendas = useMemo(
    () => (registos || []).filter((r) => r.tipo === 'venda').reduce((s, r) => s + (Number(r.valor) || 0), 0),
    [registos]
  )
  const totalCompras = useMemo(
    () => (registos || []).filter((r) => r.tipo === 'compra').reduce((s, r) => s + (Number(r.valor) || 0), 0),
    [registos]
  )
  const lucro = totalVendas - totalCompras

  const equipaGrupo = user?.grupo || ''

  const metaEquipa = useMemo(() => {
    if (!Array.isArray(metas)) return 0
    const m = metas.find((x) => x.equipaId === equipaGrupo || x.grupo === equipaGrupo)
    return Number(m?.meta) || 0
  }, [metas, equipaGrupo])

  const metaPorMembroData = useMemo(() => {
    const list = equipaGrupo ? (usuarios || []).filter((u) => u.grupo === equipaGrupo) : []
    return list.map((u) => {
      const metaObj = Array.isArray(metas) ? metas.find((m) => String(m.userId) === String(u.id)) : null
      const metaVal = Number(metaObj?.meta) || 0
      const apanhasSemana = (apanhas || []).reduce((acc, a) => {
        if (Number(a.user_id) !== Number(u.id)) return acc
        const d = a.datahora ? new Date(a.datahora) : null
        if (!d || d < weekStart || d > weekEnd) return acc
        return acc + (Number(a.quantidade) || 0)
      }, 0)
      return { nome: u.nome, meta: metaVal, realizado: apanhasSemana }
    })
  }, [usuarios, equipaGrupo, metas, apanhas, weekStart, weekEnd])

  const realizacaoEquipa = useMemo(
    () => metaPorMembroData.reduce((s, x) => s + x.realizado, 0),
    [metaPorMembroData]
  )

  const userById = useMemo(() => {
    const map = {}
    ;(usuarios || []).forEach((u) => { map[String(u.id)] = u })
    return map
  }, [usuarios])

  const semanaPorEquipaData = useMemo(() => {
    const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F']
    const byWeek = new Map()
    for (const a of apanhas || []) {
      const d = a.datahora ? new Date(a.datahora) : null
      if (!d) continue
      const weekKey = getWeekKey(d)
      const u = userById[String(a.user_id)]
      const grupo = u?.grupo || ''
      if (!grupo || !GROUPS.includes(grupo)) continue
      if (!byWeek.has(weekKey)) byWeek.set(weekKey, { periodo: weekKey, ...Object.fromEntries(GROUPS.map((g) => [g, 0])) })
      const row = byWeek.get(weekKey)
      row[grupo] = (row[grupo] || 0) + (Number(a.quantidade) || 0)
    }
    return Array.from(byWeek.values()).sort((a, b) => a.periodo.localeCompare(b.periodo))
  }, [apanhas, userById])

  const themeKey = isLight ? 'light' : 'dark'
  const t = CHART_THEME[themeKey]


  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold mt-0">Dashboard</h2>
        <button type="button" onClick={() => loadData?.()} className="btn-primary text-sm py-2 px-4">
          Atualizar
        </button>
      </div>

      {/* Pessoal: todos */}
      <section className="mb-8">
        <h3 className={`text-base font-semibold mb-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          O meu desempenho
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className={t.chartWrapperClass + ' p-4'}>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Meta semanal</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-sky-400">{pessoalApanhasSemana}</span>
              <span className="text-slate-500">/ {Number(metaUser) || 0}</span>
            </div>
            <div className={`mt-2 h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
                style={{
                  width: `${Number(metaUser) ? Math.min(100, (pessoalApanhasSemana / Number(metaUser)) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
          <div className={t.chartWrapperClass + ' p-4'}>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Valor a receber</p>
            <p className="text-2xl font-bold text-emerald-400">
              {Number(valorReceberUser).toFixed(2)} €
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Conforme o seu valor por peixe e o que recolheu desde o último pagamento.
            </p>
          </div>
        </div>
      </section>

      {/* Direção/Gestor: gráfico semanal por equipa + rank tempo online */}
      {isDirecao && (
        <section className="mb-8">
          <h3 className={`text-base font-semibold mb-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Desempenho semanal por equipa
          </h3>
          {semanaPorEquipaData.length > 0 ? (
            <div className={`${t.chartWrapperClass} h-64 mb-6`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={semanaPorEquipaData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 10, fill: t.tickFill }}
                    stroke={t.axisStroke}
                    axisLine={{ stroke: t.axisStroke }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: t.tickFill }}
                    stroke={t.axisStroke}
                    axisLine={{ stroke: t.axisStroke }}
                  />
                  <Tooltip
                    wrapperStyle={{
                      outline: 'none',
                      backgroundColor: t.tooltipBg,
                      border: t.tooltipBorder,
                      borderRadius: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)',
                    }}
                    contentStyle={{
                      backgroundColor: t.tooltipBg,
                      border: 'none',
                      padding: 0,
                      color: t.tooltipText,
                    }}
                    labelStyle={{ color: t.tooltipLabel }}
                    itemStyle={{ color: t.tooltipText }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span style={{ color: t.legendText }}>{value}</span>} />
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((g, i) => {
                    const colors = [t.lineVendas, t.lineCompras, '#10b981', '#8b5cf6', '#ec4899', '#f97316']
                    return (
                      <Line
                        key={g}
                        type="monotone"
                        dataKey={g}
                        name={`Equipa ${g}`}
                        stroke={colors[i % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3, fill: colors[i % colors.length], strokeWidth: 0 }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-sm mb-4">Sem dados de desempenho por equipa nas últimas semanas.</p>
          )}

          <h4 className={`text-sm font-semibold mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Mais tempo online esta semana
          </h4>
          {tempoOnlineRank.length === 0 ? (
            <p className="text-slate-500 text-sm">Ainda não há registo de tempo online esta semana.</p>
          ) : (
            <div
              className={`overflow-x-auto max-h-48 overflow-y-auto rounded-xl border ${
                isLight ? 'border-slate-300 bg-white/80' : 'border-slate-600 bg-slate-800/50'
              }`}
            >
              <table className="w-full text-sm border-collapse">
                <thead className={`sticky top-0 ${isLight ? 'bg-slate-100' : 'bg-slate-800/95'}`}>
                  <tr>
                    <th
                      className={`border px-2 py-1.5 text-left font-medium ${
                        isLight ? 'border-slate-300 text-slate-600' : 'border-slate-600 text-slate-400'
                      }`}
                    >
                      #
                    </th>
                    <th
                      className={`border px-2 py-1.5 text-left font-medium ${
                        isLight ? 'border-slate-300 text-slate-600' : 'border-slate-600 text-slate-400'
                      }`}
                    >
                      Nome
                    </th>
                    <th
                      className={`border px-2 py-1.5 text-left font-medium ${
                        isLight ? 'border-slate-300 text-slate-600' : 'border-slate-600 text-slate-400'
                      }`}
                    >
                      Minutos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tempoOnlineRank.map((r, i) => (
                    <tr key={r.userId ?? i}>
                      <td
                        className={`border px-2 py-1.5 ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-600 text-slate-300'}`}
                      >
                        {i + 1}
                      </td>
                      <td
                        className={`border px-2 py-1.5 ${isLight ? 'border-slate-200 text-slate-800' : 'border-slate-600 text-slate-200'}`}
                      >
                        {r.nome ?? '—'}
                      </td>
                      <td
                        className={`border px-2 py-1.5 ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-600 text-slate-300'}`}
                      >
                        {r.minutes ?? 0} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Supervisores */}
      {(isSupervisor || isDirecao) && (
        <section className="mb-8">
          <h3 className={`text-base font-semibold mb-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Equipa
          </h3>
          <div className={`${t.chartWrapperClass} p-4 mb-4`}>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Meta da equipa</p>
            <p className="text-xl font-semibold">
              <span className="text-sky-400">{realizacaoEquipa}</span>
              <span className="text-slate-500"> / {metaEquipa}</span>
            </p>
            <div className={`mt-2 h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
                style={{
                  width: `${metaEquipa ? Math.min(100, (realizacaoEquipa / metaEquipa) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
          {metaPorMembroData.length > 0 && (
            <div className={`${t.chartWrapperClass} h-64`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metaPorMembroData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 11, fill: t.tickFill }}
                    stroke={t.axisStroke}
                    axisLine={{ stroke: t.axisStroke }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: t.tickFill }}
                    stroke={t.axisStroke}
                    axisLine={{ stroke: t.axisStroke }}
                  />
                  <Tooltip
                    wrapperStyle={{
                      outline: 'none',
                      backgroundColor: t.tooltipBg,
                      border: t.tooltipBorder,
                      borderRadius: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)',
                    }}
                    contentStyle={{
                      backgroundColor: t.tooltipBg,
                      border: 'none',
                      padding: 0,
                      color: t.tooltipText,
                    }}
                    labelStyle={{ color: t.tooltipLabel }}
                    itemStyle={{ color: t.tooltipText }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span style={{ color: t.legendText }}>{value}</span>} />
                  <Bar dataKey="meta" name="Meta" fill={t.barMeta} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" name="Realizado" fill={t.barRealizado} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      )}

      {/* Direção */}
      {isDirecao && (
        <section className="mb-8">
          <h3 className={`text-base font-semibold mb-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Compras e Vendas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className={`${t.chartWrapperClass} p-4`}>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Total vendas</p>
              <p className="text-xl font-bold text-sky-400">{totalVendas.toFixed(2)} €</p>
            </div>
            <div className={`${t.chartWrapperClass} p-4`}>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Total compras</p>
              <p className="text-xl font-bold text-amber-400">{totalCompras.toFixed(2)} €</p>
            </div>
            <div className={`${t.chartWrapperClass} p-4`}>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Lucro</p>
              <p className={`text-xl font-bold ${lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {lucro.toFixed(2)} €
              </p>
            </div>
          </div>
          {comprasVendasCombo.length > 0 && (
            <div className={`${t.chartWrapperClass} h-64 mb-6`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comprasVendasCombo} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 10, fill: t.tickFill }}
                    stroke={t.axisStroke}
                    axisLine={{ stroke: t.axisStroke }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: t.tickFill }}
                    stroke={t.axisStroke}
                    axisLine={{ stroke: t.axisStroke }}
                  />
                  <Tooltip
                    wrapperStyle={{
                      outline: 'none',
                      backgroundColor: t.tooltipBg,
                      border: t.tooltipBorder,
                      borderRadius: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)',
                    }}
                    contentStyle={{
                      backgroundColor: t.tooltipBg,
                      border: 'none',
                      padding: 0,
                      color: t.tooltipText,
                    }}
                    labelStyle={{ color: t.tooltipLabel }}
                    itemStyle={{ color: t.tooltipText }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span style={{ color: t.legendText }}>{value}</span>} />
                  <Line
                    type="monotone"
                    dataKey="vendas"
                    name="Vendas (€)"
                    stroke={t.lineVendas}
                    strokeWidth={2}
                    dot={{ r: 4, fill: t.lineVendas, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="compras"
                    name="Compras (€)"
                    stroke={t.lineCompras}
                    strokeWidth={2}
                    dot={{ r: 4, fill: t.lineCompras, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
