import { useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function RecoveryScreen({ onBack }) {
  const { showToast, isLight } = useApp()
  const labelClass = isLight ? 'block text-xs font-medium uppercase tracking-wider text-slate-600' : 'block text-xs font-medium uppercase tracking-wider text-slate-500'
  const mutedClass = isLight ? 'text-slate-600' : 'text-slate-500'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')

  const handleEnviar = (e) => {
    e.preventDefault()
    if (!nome.trim()) {
      showToast('Preencha o nome de utilizador.', 'error')
      return
    }
    setMensagem('Se existir uma conta com esse nome, receberá instruções por email.')
    showToast('Pedido de recuperação enviado. Verifique o email.', 'success')
  }

  return (
    <div className="py-8 px-4 sm:py-14 sm:px-8 text-center w-full max-w-md mx-auto">
      <h2 className="text-lg sm:text-xl font-semibold mb-2">Recuperação de PIN</h2>
      <p className={`${mutedClass} text-sm mb-6`}>
        Indique o seu nome de utilizador. Se existir conta associada, enviaremos instruções.
      </p>
      <form onSubmit={handleEnviar} className="text-left space-y-4">
        <div>
          <label className={labelClass}>
            Nome de utilizador
          </label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="glass-input mt-2"
            autoComplete="username"
          />
        </div>
        <div>
          <label className={labelClass}>
            Email (opcional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input mt-2"
            autoComplete="email"
          />
        </div>
        {mensagem && (
          <p className="text-sm text-sky-400 rounded-lg bg-sky-500/10 border border-sky-500/30 p-3">
            {mensagem}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="pill inline-flex items-center gap-2 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </button>
          <button type="submit" className="btn-primary inline-flex items-center gap-2 min-h-[44px]">
            <Send className="h-4 w-4" />
            Enviar
          </button>
        </div>
      </form>
    </div>
  )
}
