import { useState, useEffect, useRef, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { apiGet, apiPost } from '../api'

const DEBOUNCE_MS = 1200
const MAX_LENGTH = 50000

export default function ContentNotas() {
  const { user, isLight } = useApp()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const debounceRef = useRef(null)

  const loadNotas = useCallback(async () => {
    if (!user?.id) return
    try {
      const data = await apiGet('notas?userId=' + encodeURIComponent(user.id))
      setContent(typeof data?.content === 'string' ? data.content : '')
    } catch (err) {
      console.warn('loadNotas', err)
      setContent('')
    } finally {
      setLoaded(true)
    }
  }, [user?.id])

  useEffect(() => {
    loadNotas()
  }, [loadNotas])

  const saveNotas = useCallback(
    async (text) => {
      if (!user?.id) return
      setSaving(true)
      try {
        await apiPost('notas', { userId: user.id, content: text })
      } catch (err) {
        console.warn('saveNotas', err)
      } finally {
        setSaving(false)
      }
    },
    [user?.id]
  )

  const handleChange = (e) => {
    const value = e.target.value
    if (value.length > MAX_LENGTH) return
    setContent(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveNotas(value), DEBOUNCE_MS)
  }

  const handleBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    saveNotas(content)
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  return (
    <div className="glass-card flex flex-col min-h-[320px] h-full">
      <h2 className="text-lg font-semibold mt-0 mb-2 px-5 pt-5 flex items-center gap-2">
        <FileText className="h-5 w-5 shrink-0" aria-hidden />
        Bloco de Notas
      </h2>
      <p className={`px-5 text-sm mb-3 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
        As tuas notas são privadas e só tu as podes ver. São guardadas automaticamente.
      </p>
      {!loaded ? (
        <p className={`flex-1 px-5 text-sm ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>A carregar…</p>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 px-5 pb-5">
          <textarea
            value={content}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="As tuas notas privadas..."
            className={`glass-input flex-1 min-h-[200px] resize-y ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
            maxLength={MAX_LENGTH}
            aria-label="Bloco de notas"
          />
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              {content.length.toLocaleString('pt-PT')} / {MAX_LENGTH.toLocaleString('pt-PT')} caracteres
            </span>
            {saving && (
              <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>A guardar…</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
