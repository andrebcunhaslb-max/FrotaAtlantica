import { useState, useMemo } from 'react'
import { Save } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ContentVendas() {
  const { usuarios, registos, saveRegistos, showToast, isLight } = useApp()
  const labelClass = isLight ? 'block text-xs font-medium uppercase tracking-wider text-slate-600' : 'block text-xs font-medium uppercase tracking-wider text-slate-500'
  const [vendedor, setVendedor] = useState('')
  const [cliente, setCliente] = useState('')
  const [qtd, setQtd] = useState('')
  const [preco, setPreco] = useState('')

  const valor = useMemo(() => {
    const q = Number(qtd) || 0
    const p = Number(preco) || 0
    return q * p
  }, [qtd, preco])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!vendedor || !cliente || !qtd || !valor) {
      showToast('Preencha todos os campos da venda.', 'error')
      return
    }
    const novo = [
      ...registos,
      {
        tipo: 'venda',
        funcionario: vendedor,
        entidade: cliente,
        qtd: Number(qtd),
        valor,
        data: new Date().toLocaleString('pt-PT'),
      },
    ]
    try {
      await saveRegistos(novo)
      setVendedor('')
      setCliente('')
      setQtd('')
      setPreco('')
      showToast('Venda registada com sucesso.', 'success')
    } catch {
      showToast('Erro ao guardar no servidor.', 'error')
    }
  }

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mt-0 mb-4">Vendas</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>
            Funcionário
          </label>
          <select
            value={vendedor}
            onChange={(e) => setVendedor(e.target.value)}
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
          <label className={labelClass}>
            Cliente
          </label>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="glass-input mt-2"
          />
        </div>
        <div>
          <label className={labelClass}>
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
          <label className={labelClass}>
            Preço por caixa (€)
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="0.00"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className="glass-input mt-2"
          />
        </div>
        <div>
          <label className={labelClass}>
            Valor (€)
          </label>
          <input
            type="number"
            readOnly
            value={valor ? valor.toFixed(2) : ''}
            className={`glass-input mt-2 ${!isLight ? 'bg-slate-800/50' : ''}`}
          />
        </div>
        <button type="submit" className="btn-primary inline-flex items-center gap-2">
          <Save className="h-4 w-4" />
          Guardar Venda
        </button>
      </form>
    </div>
  )
}
