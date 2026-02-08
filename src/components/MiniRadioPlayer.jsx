import { useState, useRef, useEffect, useCallback } from 'react'
import { Volume2, VolumeX, ChevronLeft, ChevronRight, List, Radio, Minus, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'

const RADIO_BROWSER_API = 'https://de1.api.radio-browser.info'
const CACHE_KEY = 'frota_radio_stations'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

// Fallback: estações com URLs que costumam funcionar (MP3/AAC diretos)
const FALLBACK_RADIOS = [
  { id: 'm80-80s', name: 'M80 – 80s', streamUrl: 'https://stream-icy.bauermedia.pt/m8080.aac' },
  { id: 'm80-pop', name: 'M80 – Pop', streamUrl: 'https://stream-icy.bauermedia.pt/m80pop.aac' },
  { id: 'rfm-80s', name: '80\'s RFM', streamUrl: 'https://25343.live.streamtheworld.com/GR80SRFMAAC.aac' },
  { id: 'rfm-90s', name: '90\'s RFM', streamUrl: 'https://25343.live.streamtheworld.com/RFM_90SAAC.aac' },
  { id: 'cascais', name: '105.4 Cascais - O Rock da Linha', streamUrl: 'https://play.radioregional.pt:8220/stream/2/;;/stream.mp3' },
  { id: 'renascenca', name: 'Renascença', streamUrl: 'https://stream.renascenca.pt/rc.mp3' },
]

const VOLUME_STEP = 0.1

function parseCachedStations() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, at } = JSON.parse(raw)
    if (Array.isArray(data) && data.length > 0 && Date.now() - at < CACHE_TTL_MS) {
      return data
    }
  } catch (_) {}
  return null
}

function saveCachedStations(stations) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: stations, at: Date.now() }))
  } catch (_) {}
}

export default function MiniRadioPlayer() {
  const { isLight, showToast } = useApp()
  const audioRef = useRef(null)
  const [stations, setStations] = useState(() => parseCachedStations() || FALLBACK_RADIOS)
  const [loading, setLoading] = useState(!parseCachedStations())
  const [stationIndex, setStationIndex] = useState(() => {
    try {
      const s = localStorage.getItem('frota_radio_stationIndex')
      const n = s ? parseInt(s, 10) : 0
      const list = parseCachedStations() || FALLBACK_RADIOS
      return Number.isFinite(n) && n >= 0 && n < list.length ? n : 0
    } catch {
      return 0
    }
  })
  const [volume, setVolume] = useState(() => {
    try {
      const v = localStorage.getItem('frota_radio_volume')
      const n = v ? parseFloat(v) : 0.7
      return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.7
    } catch {
      return 0.7
    }
  })
  const [muted, setMuted] = useState(false)
  const volumeBeforeMute = useRef(0.7)
  const [listOpen, setListOpen] = useState(false)
  const userInitiatedPlay = useRef(false)

  const currentStation = stations[stationIndex]

  useEffect(() => {
    if (parseCachedStations()) return
    const ac = new AbortController()
    fetch(
      `${RADIO_BROWSER_API}/json/stations/search?countrycode=PT&language=portuguese&limit=25&order=votes&reverse=true`,
      { signal: ac.signal, headers: { 'User-Agent': 'FrotaAtlantica/1.0' } }
    )
      .then((res) => res.json())
      .then((arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return
        const seen = new Set()
        const list = arr
          .filter((s) => s.url_resolved && s.url_resolved.startsWith('https://') && !seen.has(s.name?.trim()))
          .slice(0, 20)
          .map((s) => {
            seen.add(s.name?.trim())
            return { id: s.stationuuid || s.name, name: (s.name || '').trim() || 'Rádio', streamUrl: s.url_resolved }
          })
        if (list.length > 0) {
          setStations(list)
          saveCachedStations(list)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [])

  useEffect(() => {
    setStationIndex((i) => (stations.length ? Math.min(i, stations.length - 1) : 0))
  }, [stations.length])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume
  }, [volume, muted])

  useEffect(() => {
    try {
      localStorage.setItem('frota_radio_volume', String(volume))
    } catch (_) {}
  }, [volume])

  useEffect(() => {
    try {
      localStorage.setItem('frota_radio_stationIndex', String(stationIndex))
    } catch (_) {}
  }, [stationIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentStation?.streamUrl) return
    audio.pause()
    audio.src = currentStation.streamUrl
    audio.load()
    if (userInitiatedPlay.current) {
      const playPromise = audio.play()
      if (playPromise?.catch) {
        playPromise.catch((err) => {
          console.warn('MiniRadioPlayer play', err)
          showToast?.('Se o som não iniciar, escolhe outra rádio na lista.', 'error')
        })
      }
    }
    return () => {
      audio.pause()
      audio.removeAttribute('src')
    }
  }, [stationIndex, currentStation?.streamUrl, showToast])

  const handleVolumeDown = useCallback(() => {
    setVolume((v) => Math.max(0, v - VOLUME_STEP))
  }, [])
  const handleVolumeUp = useCallback(() => {
    setVolume((v) => Math.min(1, v + VOLUME_STEP))
  }, [])
  const handleMute = useCallback(() => {
    if (muted) {
      setVolume(volumeBeforeMute.current)
      setMuted(false)
    } else {
      volumeBeforeMute.current = volume
      setVolume(0)
      setMuted(true)
    }
  }, [muted, volume])
  const handlePrev = useCallback(() => {
    userInitiatedPlay.current = true
    setStationIndex((i) => (i === 0 ? stations.length - 1 : i - 1))
  }, [stations.length])
  const handleNext = useCallback(() => {
    userInitiatedPlay.current = true
    setStationIndex((i) => (i === stations.length - 1 ? 0 : i + 1))
  }, [stations.length])
  const handleSelectStation = useCallback((index) => {
    userInitiatedPlay.current = true
    setStationIndex(index)
    setListOpen(false)
  }, [])
  const handleAudioError = useCallback(() => {
    showToast?.('Erro a reproduzir esta rádio. Tenta outra.', 'error')
  }, [showToast])

  const barBg = isLight ? 'bg-white/95 border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]' : 'bg-slate-900/95 border-t border-slate-600 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]'
  const btnClass = isLight
    ? 'p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition'
    : 'p-2 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 transition'
  const listBg = isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-600'

  return (
    <>
      <audio ref={audioRef} onError={handleAudioError} preload="none" />
      <div
        className={`mini-radio-bar flex items-center gap-2 sm:gap-3 px-3 py-2 ${barBg} backdrop-blur-sm z-10`}
        role="region"
        aria-label="Mini player de rádio"
      >
        <span className="flex items-center gap-1.5 text-slate-500 shrink-0" aria-hidden>
          <Radio className="h-4 w-4" />
        </span>
        <span
          className={`min-w-0 truncate max-w-[120px] sm:max-w-[180px] text-sm font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
          aria-live="polite"
          title={currentStation?.name}
        >
          {loading ? '…' : (currentStation?.name ?? '—')}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={handlePrev} className={btnClass} aria-label="Rádio anterior" title="Rádio anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleNext} className={btnClass} aria-label="Próxima rádio" title="Próxima rádio">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={handleVolumeDown} className={btnClass} aria-label="Diminuir volume" title="Diminuir volume">
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleVolumeUp} className={btnClass} aria-label="Aumentar volume" title="Aumentar volume">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleMute} className={btnClass} aria-label={muted ? 'Desativar mute' : 'Mute'} title={muted ? 'Desativar mute' : 'Mute'}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setListOpen((o) => !o)}
            className={`pill text-xs py-1.5 px-2.5 flex items-center gap-1.5 ${listOpen ? 'pill-active' : ''}`}
            aria-label="Abrir lista de rádios"
            aria-expanded={listOpen}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </button>
          {listOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setListOpen(false)} />
              <div
                className={`absolute bottom-full left-0 mb-1 w-64 max-h-64 overflow-y-auto rounded-xl border ${listBg} shadow-xl z-20`}
                role="listbox"
                aria-label="Escolher rádio"
              >
                <p className={`text-xs font-medium uppercase tracking-wider px-3 py-2 border-b ${isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-600'}`}>
                  Rádios PT
                </p>
                <div className="p-1">
                  {stations.map((r, idx) => (
                    <button
                      key={r.id}
                      type="button"
                      role="option"
                      aria-selected={idx === stationIndex}
                      onClick={() => handleSelectStation(idx)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${idx === stationIndex ? (isLight ? 'bg-sky-100 text-sky-800 font-medium' : 'bg-sky-900/40 text-sky-200 font-medium') : isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-700 text-slate-200'}`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
