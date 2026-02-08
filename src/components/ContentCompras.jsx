import { useState, useMemo } from 'react'
import { Save } from 'lucide-react'
import { useApp } from '../context/AppContext'
import GlassSelect from './GlassSelect'

export default function ContentCompras() {
  const { usuarios, registos, saveRegistos, showToast, precoPeixe, isLight } = useApp()
  const labelClass = isLight ? 'block text-xs font-medium uppercase tracking-wider text-slate-600' : 'block text-xs font-medium uppercase tracking-wider text-slate-500'
  const [comprador, setComprador] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [parceria, setParceria] = useState('nao')
  const [qtd, setQtd] = useState('')

  // Preços globais de venda (definidos na admin), para registar compras — não confundir com valor por jogador (pagamento ao jogador)
  const precoSem = precoPeixe?.sem ?? 36
  const precoParceria = precoPeixe?.parceria ?? 38
  const preco = parceria === 'sim' ? precoParceria : precoSem
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Funcionário
            </label>
            <GlassSelect
              value={comprador}
              onChange={setComprador}
              className="mt-2"
              options={[
                { value: '', label: '—' },
                ...usuarios.map((u) => ({ value: u.nome, label: u.nome })),
              ]}
            />
          </div>
          <div>
            <label className={labelClass}>
              Fornecedor
            </label>
            <input
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              className="glass-input mt-2"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>
            Fornecedor é parceiro?
          </label>
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => setParceria('nao')}
              className={`pill min-h-[44px] ${parceria === 'nao' ? 'pill-active' : ''}`}
            >
              Não parceiro ({precoSem}€)
            </button>
            <button
              type="button"
              onClick={() => setParceria('sim')}
              className={`pill min-h-[44px] ${parceria === 'sim' ? 'pill-active' : ''}`}
            >
              Parceiro ({precoParceria}€)
            </button>
          </div>
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
            Valor (€)
          </label>
          <input
            type="number"
            readOnly
            value={valor ? valor.toFixed(2) : ''}
            className={`glass-input mt-2 ${!isLight ? 'bg-slate-800/50' : ''}`}
          />
        </div>
        <button type="submit" className="btn-primary inline-flex items-center gap-2 min-h-[44px]">
          <Save className="h-4 w-4" />
          Guardar Compra
        </button>
      </form>
    </div>
  )
}
