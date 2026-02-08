import { useState, useRef, useEffect, useCallback } from 'react'
import { Volume2, VolumeX, ChevronLeft, ChevronRight, List, Radio, Play, Pause, Search } from 'lucide-react'
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
  { id: 'cidade', name: 'Radio Cidade', streamUrl: 'https://stream-icy.bauermedia.pt/cidade.mp3' },
  { id: 'orbital', name: 'Radio Orbital', streamUrl: 'https://ec2.yesstreaming.net:3025/stream' },
  { id: 'mega', name: 'Radio Mega', streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/MEGA_HITS_SC' },
]

// Rádios fixas que devem aparecer sempre na lista (mesmo quando a API carrega outras)
const FIXED_RADIOS = [
  { id: 'cidade', name: 'Radio Cidade', streamUrl: 'https://stream-icy.bauermedia.pt/cidade.mp3' },
  { id: 'orbital', name: 'Radio Orbital', streamUrl: 'https://ec2.yesstreaming.net:3025/stream' },
  { id: 'mega', name: 'Radio Mega', streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/MEGA_HITS_SC' },
]

function mergeStationsWithFixed(apiList) {
  const fixedIds = new Set(FIXED_RADIOS.map((r) => r.id))
  const fixedNames = new Set(FIXED_RADIOS.map((r) => (r.name || '').trim().toLowerCase()))
  const seen = new Set(fixedNames)
  const filtered = (apiList || []).filter((r) => {
    if (fixedIds.has(r.id)) return false
    const name = (r.name || '').trim().toLowerCase()
    if (fixedNames.has(name) || seen.has(name)) return false
    seen.add(name)
    return true
  })
  return [...FIXED_RADIOS, ...filtered]
}

function parseCachedStations() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, at } = JSON.parse(raw)
    if (Array.isArray(data) && Date.now() - at < CACHE_TTL_MS) {
      return mergeStationsWithFixed(data.length > 0 ? data : [])
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const userInitiatedPlay = useRef(false)

  const currentStation = stations[stationIndex]

  useEffect(() => {
    if (parseCachedStations()) return
    const ac = new AbortController()
    fetch(
      `${RADIO_BROWSER_API}/json/stations/search?countrycode=PT&limit=500&order=votes&reverse=true`,
      { signal: ac.signal, headers: { 'User-Agent': 'FrotaAtlantica/1.0' } }
    )
      .then((res) => res.json())
      .then((arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return
        const seen = new Set()
        const list = arr
          .filter((s) => {
            if (!s.url_resolved || !s.url_resolved.startsWith('https://')) return false
            const name = (s.name || '').trim()
            if (!name || seen.has(name.toLowerCase())) return false
            seen.add(name.toLowerCase())
            return true
          })
          .map((s) => ({ id: s.stationuuid || s.name, name: (s.name || '').trim() || 'Rádio', streamUrl: s.url_resolved }))
        const merged = mergeStationsWithFixed(list.length > 0 ? list : [])
        if (merged.length > 0) {
          setStations(merged)
          saveCachedStations(merged)
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
    setIsPlaying(false)
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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [])

  const handleVolumeChange = useCallback((e) => {
    const v = parseFloat(e.target.value) || 0
    setVolume(Math.max(0, Math.min(1, v)))
    if (muted && v > 0) {
      setMuted(false)
    }
  }, [muted])
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

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    userInitiatedPlay.current = true
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch((err) => {
        console.warn('MiniRadioPlayer play', err)
        showToast?.('Se o som não iniciar, escolhe outra rádio na lista.', 'error')
      })
      setIsPlaying(true)
    }
  }, [isPlaying, showToast])
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
          <button
            type="button"
            onClick={handlePlayPause}
            className={`${btnClass} p-2.5 ${isPlaying ? '' : ''}`}
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <button type="button" onClick={handleNext} className={btnClass} aria-label="Próxima rádio" title="Próxima rádio">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial sm:min-w-[180px] sm:max-w-[220px]">
          <button type="button" onClick={handleMute} className={`${btnClass} shrink-0`} aria-label={muted ? 'Desativar mute' : 'Mute'} title={muted ? 'Desativar mute' : 'Mute'}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer group">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="mini-radio-volume w-full"
              aria-label="Volume"
            />
          </label>
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
                className={`absolute bottom-full right-0 mb-1 min-w-[200px] w-72 max-w-[min(90vw,320px)] max-h-[70vh] overflow-y-auto rounded-xl border ${listBg} shadow-xl z-20`}
                role="listbox"
                aria-label="Escolher rádio"
              >
                <p className={`text-xs font-medium uppercase tracking-wider px-3 py-2 border-b whitespace-nowrap ${isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-600'}`}>
                  Rádios PT
                </p>
                <div className={`p-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-600'}`}>
                  <label className={`flex items-center gap-2 w-full rounded-lg border px-2.5 py-1.5 text-sm bg-transparent focus-within:ring-2 focus-within:ring-sky-500/30 ${isLight ? 'border-slate-200' : 'border-slate-600'}`}>
                    <Search className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Procurar por nome..."
                      className={`flex-1 min-w-0 bg-transparent outline-none ${isLight ? 'text-slate-800 placeholder-slate-400' : 'text-slate-200 placeholder-slate-500'}`}
                      aria-label="Procurar rádio por nome"
                    />
                  </label>
                </div>
                <div className="p-1">
                  {(() => {
                    const filtered = stations.filter(
                      (r) => !searchQuery.trim() || (r.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
                    )
                    if (filtered.length === 0) {
                      return (
                        <p className={`px-3 py-4 text-sm text-center ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Nenhuma rádio encontrada
                        </p>
                      )
                    }
                    return filtered.map((r) => {
                      const idx = stations.findIndex((s) => s.id === r.id)
                      return (
                        <button
                          key={r.id}
                          type="button"
                          role="option"
                          aria-selected={idx === stationIndex}
                          onClick={() => handleSelectStation(idx)}
                          title={r.name}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition break-words whitespace-normal ${idx === stationIndex ? (isLight ? 'bg-sky-100 text-sky-800 font-medium' : 'bg-sky-900/40 text-sky-200 font-medium') : isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-700 text-slate-200'}`}
                        >
                          {r.name}
                        </button>
                      )
                    })
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
