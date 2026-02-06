import { useState, useEffect } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ContentFarm() {
  const { user, apanhas, saveApanhas, loadData, showToast, showConfirm, precoPeixe, precoPeixePorUtilizador, isLight } = useApp()
  const [quantidade, setQuantidade] = useState('')

  const userKey = user ? String(user.id) : ''
  const valorPorPeixe = (userKey && typeof precoPeixePorUtilizador?.[userKey] === 'number')
    ? precoPeixePorUtilizador[userKey]
    : (precoPeixe?.sem ?? 36)

  const minhasApanhas = (apanhas || [])
    .filter((a) => Number(a.user_id) === Number(user?.id))
    .sort((a, b) => new Date(b.datahora || 0) - new Date(a.datahora || 0))

  const handleGuardar = async (e) => {
    e.preventDefault()
    const q = quantidade.trim()
    if (!q || Number(q) <= 0) {
      showToast('Informe uma quantidade de peixes válida.', 'error')
      return
    }
    if (!user) {
      showToast('Utilizador não identificado.', 'error')
      return
    }
    const todas = [...(apanhas || []), { user_id: user.id, quantidade: Number(q) }]
    try {
      await saveApanhas(todas)
      setQuantidade('')
      await loadData()
      showToast('Apanha registada com sucesso!', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    }
  }

  const handleApagar = (id) => {
    showConfirm({
      title: 'Apagar registo',
      message: 'Tem certeza que deseja apagar este registo?',
      variant: 'danger',
      onConfirm: async () => {
        const filtradas = (apanhas || []).filter((a) => a.id !== id && String(a.id) !== String(id))
        try {
          await saveApanhas(filtradas)
          await loadData()
          showToast('Apanha removida.', 'success')
        } catch {
          showToast('Erro ao guardar no servidor.', 'error')
        }
      }
    })
  }

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mt-0 mb-4">Minhas Apanhas de Peixe</h2>
      <form onSubmit={handleGuardar} className="space-y-4">
        <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
          Valor por peixe (pagamento): <strong>{valorPorPeixe} €</strong>
        </p>
        <div>
          <label className={`block text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
            Quantidade de Peixes
          </label>
          <input
            type="number"
            min={0}
            placeholder="Ex: 5"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className="glass-input mt-2"
          />
        </div>
        <button type="submit" className="btn-primary inline-flex items-center gap-2 mt-4">
          <Save className="h-4 w-4" />
          Registar Apanha
        </button>
      </form>
      <h3 className="text-base font-semibold mt-6 mb-2">Minhas Apanhas</h3>
      {minhasApanhas.length === 0 ? (
        <p className={isLight ? 'text-slate-600 text-sm py-3' : 'text-slate-500 text-sm py-3'}>Nenhuma apanha registada.</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {minhasApanhas.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-2 ${
                  isLight ? 'border-slate-300 bg-white/80' : 'border-slate-600 bg-slate-800/50'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className={`text-xs font-medium uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Quantidade</span>
                  <span className={isLight ? 'font-medium text-slate-800' : 'font-medium text-slate-200'}>{a.quantidade}</span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className={`text-xs font-medium uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Data e Hora</span>
                  <span className={`text-sm truncate ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {a.datahora ? new Date(a.datahora).toLocaleString('pt-PT') : '—'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApagar(a.id)}
                  className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl ${
                    isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/20'
                  }`}
                  aria-label="Apagar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className={`hidden md:block overflow-x-touch rounded-xl border ${isLight ? 'border-slate-300 bg-white/80' : 'border-slate-600'}`}>
            <table className="w-full text-sm border-collapse min-w-[320px]">
              <thead>
                <tr>
                  <th className={isLight ? 'border border-slate-300 bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-700' : 'border border-slate-600 bg-slate-800/90 px-2 py-1.5 text-left font-medium'}>
                    Quantidade
                  </th>
                  <th className={isLight ? 'border border-slate-300 bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-700' : 'border border-slate-600 bg-slate-800/90 px-2 py-1.5 text-left font-medium'}>
                    Data e Hora
                  </th>
                  <th className={isLight ? 'border border-slate-300 bg-slate-100 px-2 py-1.5 text-left font-medium text-slate-700' : 'border border-slate-600 bg-slate-800/90 px-2 py-1.5 text-left font-medium'}>
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {minhasApanhas.map((a) => (
                  <tr key={a.id}>
                    <td className={isLight ? 'border border-slate-200 px-2 py-1.5 font-medium text-slate-700' : 'border border-slate-600 px-2 py-1.5 font-medium'}>{a.quantidade}</td>
                    <td className={isLight ? 'border border-slate-200 px-2 py-1.5 text-slate-700' : 'border border-slate-600 px-2 py-1.5'}>
                      {a.datahora ? new Date(a.datahora).toLocaleString('pt-PT') : '—'}
                    </td>
                    <td className={isLight ? 'border border-slate-200 px-2 py-1.5' : 'border border-slate-600 px-2 py-1.5'}>
                      <button
                        type="button"
                        onClick={() => handleApagar(a.id)}
                        className={isLight ? 'text-red-600 hover:text-red-700 inline-flex items-center min-h-[44px]' : 'text-red-400 hover:text-red-300 inline-flex items-center min-h-[44px]'}
                        aria-label="Apagar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
