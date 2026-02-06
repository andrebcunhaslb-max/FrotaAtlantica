import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'

const DEFAULT_CONFIRM_LABEL = 'Confirmar'
const DEFAULT_CANCEL_LABEL = 'Cancelar'

export default function ConfirmModal() {
  const { confirmModal, closeConfirm, isLight } = useApp()
  const [loading, setLoading] = useState(false)
  const cancelRef = useRef(null)

  const open = confirmModal?.open ?? false
  const title = confirmModal?.title ?? ''
  const message = confirmModal?.message ?? ''
  const confirmLabel = confirmModal?.confirmLabel ?? DEFAULT_CONFIRM_LABEL
  const cancelLabel = confirmModal?.cancelLabel ?? DEFAULT_CANCEL_LABEL
  const variant = confirmModal?.variant ?? 'default'
  const onConfirm = confirmModal?.onConfirm

  useEffect(() => {
    if (!open) {
      setLoading(false)
      return
    }
    cancelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeConfirm()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, closeConfirm])

  const handleConfirm = async () => {
    if (!onConfirm || loading) return
    setLoading(true)
    try {
      const result = onConfirm()
      if (result && typeof result.then === 'function') {
        await result
      }
      closeConfirm()
    } catch (_) {
      // Caller may show toast; keep modal open or close - we close to avoid stuck state
      closeConfirm()
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (loading) return
    closeConfirm()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) closeConfirm()
  }

  if (!open) return null

  const isDanger = variant === 'danger'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden
      />
      <div className="glass-panel relative z-10 w-full max-w-md border-slate-600/60 p-6 shadow-2xl">
        <h2 id="confirm-modal-title" className={`text-lg font-semibold mb-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
          {title}
        </h2>
        <p id="confirm-modal-desc" className={`text-sm mb-6 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {message}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            ref={cancelRef}
            onClick={handleCancel}
            disabled={loading}
            className={isLight ? 'rounded-full border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50' : 'rounded-full border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700/80 disabled:opacity-50'}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={
              isDanger
                ? 'rounded-full border border-red-500/70 bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50'
                : 'btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-50'
            }
          >
            {loading ? 'A processar…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
