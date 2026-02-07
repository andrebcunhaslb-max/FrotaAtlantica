import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function ContentCalc() {
  const { precoPeixe, precoPlastico, isLight } = useApp()
  const labelClass = isLight ? 'block text-xs font-medium uppercase tracking-wider text-slate-600' : 'block text-xs font-medium uppercase tracking-wider text-slate-500'
  const priceBoxClass = isLight ? 'mt-4 rounded-xl border border-slate-300 bg-slate-50 p-4' : 'mt-4 rounded-xl border border-slate-600 bg-slate-800/50 p-4'
  const priceBoxTextClass = isLight ? 'text-slate-700' : ''
  const [material, setMaterial] = useState('peixe') // peixe | plastico
  const [qty, setQty] = useState(0)
  const [tipo, setTipo] = useState('sem') // sem | parceria

  const precoBase = material === 'plastico' ? precoPlastico : precoPeixe
  const precoSem = precoBase?.sem ?? (material === 'plastico' ? 3 : 36)
  const precoParceria = precoBase?.parceria ?? 38
  const preco = tipo === 'parceria' ? precoParceria : precoSem
  const total = useMemo(() => (Number(qty) || 0) * preco, [qty, preco])

  const qtyLabel = material === 'plastico' ? 'Quantidade (Plástico)' : 'Quantidade (Peixes)'

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mt-0 mb-4">Calculadora</h2>
      <label className={labelClass}>
        Material
      </label>
      <div className="flex gap-2 mt-2 flex-wrap">
        <button
          type="button"
          onClick={() => setMaterial('peixe')}
          className={`pill ${material === 'peixe' ? 'pill-active' : ''}`}
        >
          Peixe
        </button>
        <button
          type="button"
          onClick={() => setMaterial('plastico')}
          className={`pill ${material === 'plastico' ? 'pill-active' : ''}`}
        >
          Plástico
        </button>
      </div>
      <label className={`${labelClass} mt-4`}>
        {qtyLabel}
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
