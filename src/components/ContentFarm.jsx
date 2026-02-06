import { useState, useEffect } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ContentFarm() {
  const { user, apanhas, saveApanhas, loadData, showToast, showConfirm, precoPeixe, precoPeixePorUtilizador } = useApp()
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
        <p className="text-sm text-slate-500">
          Valor por peixe (pagamento): <strong>{valorPorPeixe} €</strong>
        </p>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
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
      <div className="overflow-x-auto rounded-xl border border-slate-600">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border border-slate-600 bg-slate-800/90 px-2 py-1.5 text-left font-medium">
                Quantidade
              </th>
              <th className="border border-slate-600 bg-slate-800/90 px-2 py-1.5 text-left font-medium">
                Data e Hora
              </th>
              <th className="border border-slate-600 bg-slate-800/90 px-2 py-1.5 text-left font-medium">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {minhasApanhas.length === 0 ? (
              <tr>
                <td colSpan={3} className="border border-slate-600 px-2 py-3 text-center text-slate-500">
                  Nenhuma apanha registada.
                </td>
              </tr>
            ) : (
              minhasApanhas.map((a) => (
                <tr key={a.id}>
                  <td className="border border-slate-600 px-2 py-1.5 font-medium">{a.quantidade}</td>
                  <td className="border border-slate-600 px-2 py-1.5">
                    {a.datahora ? new Date(a.datahora).toLocaleString('pt-PT') : '—'}
                  </td>
                  <td className="border border-slate-600 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => handleApagar(a.id)}
                      className="text-red-400 hover:text-red-300 inline-flex items-center"
                      aria-label="Apagar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
