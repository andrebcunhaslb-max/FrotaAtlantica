import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Dropdown estilizado com aspecto glass, lista com hover e seleção elegante.
 * Substitui select nativo para aparência consistente em todos os processos.
 *
 * @param {{ value: string, onChange: (value: string) => void, options: { value: string, label: string }[], className?: string, id?: string, 'aria-label'?: string, placeholder?: string }} props
 */
export default function GlassSelect({
  value,
  onChange,
  options = [],
  className = '',
  id,
  'aria-label': ariaLabel,
  placeholder,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selectedOption = options.find((o) => String(o.value) === String(value))
  const displayLabel = selectedOption ? selectedOption.label : (placeholder ?? '—')

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={id ? undefined : undefined}
        onClick={() => setOpen((v) => !v)}
        className="glass-input glass-select-trigger flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-sky-400' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-activedescendant={selectedOption ? `option-${selectedOption.value}` : undefined}
          className="glass-select-dropdown absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-auto rounded-xl border border-slate-600 bg-slate-800/95 py-1 shadow-xl backdrop-blur-md"
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <li
                key={opt.value === '' ? '__empty__' : opt.value}
                id={opt.value === '' ? undefined : `option-${opt.value}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange(opt.value)
                    setOpen(false)
                  }
                }}
                className={`glass-select-option cursor-pointer px-4 py-2.5 text-sm transition-colors first:rounded-t-[10px] last:rounded-b-[10px] ${
                  isSelected
                    ? 'bg-sky-500/25 text-sky-200'
                    : 'text-slate-200 hover:bg-slate-600/70 hover:text-white'
                }`}
              >
                {opt.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
