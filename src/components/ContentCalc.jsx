import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function ContentCalc() {
  const { precoPeixe, isLight } = useApp()
  const labelClass = isLight ? 'block text-xs font-medium uppercase tracking-wider text-slate-600' : 'block text-xs font-medium uppercase tracking-wider text-slate-500'
  const priceBoxClass = isLight ? 'mt-4 rounded-xl border border-slate-300 bg-slate-50 p-4' : 'mt-4 rounded-xl border border-slate-600 bg-slate-800/50 p-4'
  const priceBoxTextClass = isLight ? 'text-slate-700' : ''
  const [qty, setQty] = useState(0)
  const [tipo, setTipo] = useState('sem') // sem | parceria

  // Preços globais de venda (definidos na admin), para calcular vendas a outros — não confundir com valor por jogador (pagamento ao jogador)
  const precoSem = precoPeixe?.sem ?? 36
  const precoParceria = precoPeixe?.parceria ?? 38
  const preco = tipo === 'parceria' ? precoParceria : precoSem
  const total = useMemo(() => (Number(qty) || 0) * preco, [qty, preco])

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mt-0 mb-4">Calculadora</h2>
      <label className={labelClass}>
        Quantidade (Peixes)
      </label>
      <input
        type="number"
        min={0}
        value={qty || ''}
        onChange={(e) => setQty(e.target.value)}
        className="glass-input mt-2"
      />
      <label className={`${labelClass} mt-4`}>
        Tipo de venda
      </label>
      <div className="flex gap-2 mt-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTipo('sem')}
          className={`pill ${tipo === 'sem' ? 'pill-active' : ''}`}
        >
          Sem parceria ({precoSem}€)
        </button>
        <button
          type="button"
          onClick={() => setTipo('parceria')}
          className={`pill ${tipo === 'parceria' ? 'pill-active' : ''}`}
        >
          Com parceria ({precoParceria}€)
        </button>
      </div>
      <div className={priceBoxClass}>
        <div className={`flex justify-between text-sm mb-1.5 ${priceBoxTextClass}`}>
          <span>Preço unitário</span>
          <span>{preco.toFixed(2)} €</span>
        </div>
        <div className={`flex justify-between text-sm font-medium ${priceBoxTextClass}`}>
          <span>Total</span>
          <span>{total.toFixed(2)} €</span>
        </div>
      </div>
    </div>
  )
}
