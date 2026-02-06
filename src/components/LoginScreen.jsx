import { useState } from 'react'
import { Fingerprint } from 'lucide-react'
import { useApp } from '../context/AppContext'

/** Normaliza nome para comparação (minúsculas, sem acentos) para permitir login com ou sem acento. */
function normalizeNome(s) {
  if (typeof s !== 'string') return ''
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function LoginScreen({ onRecoveryClick }) {
  const { usuarios, login, showToast, isLight } = useApp()
  const labelClass = isLight ? 'block text-xs font-medium uppercase tracking-wider text-slate-600 mt-4 first:mt-0' : 'block text-xs font-medium uppercase tracking-wider text-slate-500 mt-4 first:mt-0'
  const labelClassMt4 = isLight ? 'block text-xs font-medium uppercase tracking-wider text-slate-600 mt-4' : 'block text-xs font-medium uppercase tracking-wider text-slate-500 mt-4'
  const mutedClass = isLight ? 'text-slate-600' : 'text-slate-500'
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [scanning, setScanning] = useState(false)

  const handleFingerprintClick = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      handleLogin()
    }, 1200)
  }

  const handleLogin = (e) => {
    e?.preventDefault()
    const u = normalizeNome(username)
    const p = String(pin).trim()
    // #region agent log
    const samples = usuarios.slice(0, 3).map((us) => ({
      nome: us.nome,
      pin: us.pin,
      pinType: typeof us.pin,
      nomeNorm: normalizeNome(us.nome),
      nomeMatch: !!(us.nome && normalizeNome(us.nome) === u),
      pinMatch: String(us.pin) === p
    }))
    fetch('http://127.0.0.1:7242/ingest/c893ed90-26c3-4af2-b13d-17050665f523',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginScreen.jsx:handleLogin',message:'login attempt',data:{u,p,usuariosLength:usuarios.length,samples},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (!u || !p) {
      showToast('Preencha utilizador e PIN.', 'error')
      return
    }
    const encontrado = usuarios.find(
      (us) => us.nome && normalizeNome(us.nome) === u && String(us.pin) === p
    )
    if (!encontrado) {
      // #region agent log
      const redUser = usuarios.find((us) => us.nome && normalizeNome(us.nome) === 'red')
      fetch('http://127.0.0.1:7242/ingest/c893ed90-26c3-4af2-b13d-17050665f523',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginScreen.jsx:login failed',message:'encontrado null',data:{usuariosLength:usuarios.length,u,p,redInList:!!redUser,redPin:redUser?.pin,redPinType:typeof redUser?.pin,pinEquals:redUser?String(redUser.pin)===p:null,allNomes:usuarios.map(us=>us.nome)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      if (usuarios.length === 0) {
        showToast('Nenhum utilizador carregado. Verifique a ligação ao servidor.', 'error')
      } else {
        showToast('Credenciais incorretas.', 'error')
      }
      return
    }
    login(encontrado)
    showToast(`Bem-vindo, ${encontrado.nome}`, 'success')
  }

  return (
    <div className="relative overflow-hidden py-8 px-4 sm:py-14 sm:px-8 text-center">
      <div className="absolute -top-1/2 -right-1/2 h-[200%] w-[200%] animate-pulse bg-gradient-to-br from-sky-500/10 to-transparent pointer-events-none" aria-hidden />
      <div className="relative z-10">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 -z-10 rounded-full bg-sky-500/20 blur-2xl animate-pulse" aria-hidden />
          <img
            src="/logo-frota.png"
            alt="Frota do Atlântico"
            className="h-32 w-32 sm:h-48 sm:w-48 md:h-[220px] md:w-[220px] rounded-full object-cover shadow-xl drop-shadow-2xl animate-logo-float"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent mb-1">
          Frota do Atlântico
        </h1>
        <p className={`${mutedClass} text-xs uppercase tracking-widest font-medium mt-1`}>
          Navegamos com Confiança
        </p>

        <form onSubmit={handleLogin} className="w-full max-w-[380px] mx-auto mt-6 sm:mt-9 text-left">
          <label className={labelClass}>
            Utilizador
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nome de utilizador"
            className="glass-input mt-2"
            autoComplete="username"
          />
          <label className={labelClassMt4}>
            PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="glass-input mt-2"
            autoComplete="current-password"
          />

          <div
            role="button"
            tabIndex={0}
            onClick={handleFingerprintClick}
            onKeyDown={(e) => e.key === 'Enter' && handleFingerprintClick()}
            className="mt-8 sm:mt-10 flex flex-col items-center gap-3 cursor-pointer min-h-[44px]"
            aria-label="Toque para entrar"
          >
            <div
              className={`relative flex h-[80px] w-[80px] sm:h-[110px] sm:w-[110px] items-center justify-center rounded-full border-2 border-sky-400/40 bg-gradient-to-b from-sky-400/15 to-transparent shadow-lg transition overflow-hidden ${
                scanning ? 'ring-4 ring-sky-400/30' : 'hover:border-sky-400 hover:shadow-sky-500/20'
              }`}
            >
              {scanning && (
                <div
                  className="absolute h-[60px] w-[60px] sm:h-[85px] sm:w-[85px] rounded-full bg-gradient-to-b from-transparent via-sky-400/80 to-transparent animate-scan-finger blur-[2px]"
                  aria-hidden
                />
              )}
              <Fingerprint className="h-12 w-12 sm:h-16 sm:w-16 text-sky-400 relative z-10" strokeWidth={2} />
            </div>
            <p className={`text-sm font-medium tracking-wide ${mutedClass}`}>Toque para entrar</p>
          </div>
          {onRecoveryClick && (
            <button
              type="button"
              onClick={onRecoveryClick}
              className={`mt-6 text-sm hover:text-sky-400 transition ${mutedClass}`}
            >
              Esqueceu PIN?
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
