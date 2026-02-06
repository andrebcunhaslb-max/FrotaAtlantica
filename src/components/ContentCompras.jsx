import { useState, useMemo } from 'react'
import { Save } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ContentCompras() {
  const { usuarios, registos, saveRegistos, showToast } = useApp()
  const [comprador, setComprador] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [parceria, setParceria] = useState('nao')
  const [qtd, setQtd] = useState('')

  const preco = parceria === 'sim' ? 38 : 36
  const valor = useMemo(() => (Number(qtd) || 0) * preco, [qtd, preco])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comprador || !fornecedor || !qtd) {
      showToast('Preencha todos os campos da compra.', 'error')
      return
    }
    const novo = [
      ...registos,
      {
        tipo: 'compra',
        funcionario: comprador,
        entidade: fornecedor,
        qtd: Number(qtd),
        valor,
        data: new Date().toLocaleString('pt-PT'),
      },
    ]
    try {
      await saveRegistos(novo)
      setComprador('')
      setFornecedor('')
      setQtd('')
      showToast('Compra registada com sucesso.', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    }
  }

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mt-0 mb-4">Compras</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Funcionário
          </label>
          <select
            value={comprador}
            onChange={(e) => setComprador(e.target.value)}
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
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Fornecedor
          </label>
          <input
            value={fornecedor}
            onChange={(e) => setFornecedor(e.target.value)}
            className="glass-input mt-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Fornecedor é parceiro?
          </label>
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => setParceria('nao')}
              className={`pill ${parceria === 'nao' ? 'pill-active' : ''}`}
            >
              Não parceiro (36€)
            </button>
            <button
              type="button"
              onClick={() => setParceria('sim')}
              className={`pill ${parceria === 'sim' ? 'pill-active' : ''}`}
            >
              Parceiro (38€)
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Quantidade
          </label>
          <input
            type="number"
            min={0}
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            className="glass-input mt-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Valor (€)
          </label>
          <input
            type="number"
            readOnly
            value={valor ? valor.toFixed(2) : ''}
            className="glass-input mt-2 bg-slate-800/50"
          />
        </div>
        <button type="submit" className="btn-primary inline-flex items-center gap-2">
          <Save className="h-4 w-4" />
          Guardar Compra
        </button>
      </form>
    </div>
  )
}
