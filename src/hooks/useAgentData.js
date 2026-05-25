import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const WS_URL   = import.meta.env.VITE_WS_URL  || 'ws://127.0.0.1:8000/ws'

export function useAgentData() {
  const [dashboard,  setDashboard]  = useState(null)
  const [incidents,  setIncidents]  = useState([])
  const [liveMetrics, setLiveMetrics] = useState({})
  const [connected,  setConnected]  = useState(false)
  const [alerts,     setAlerts]     = useState([])
  const wsRef = useRef(null)

  // ── REST polling ────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/dashboard`)
      const d = await r.json()
      setDashboard(d)
      setIncidents(d.recent_incidents || [])
    } catch (_) {}
  }, [])

  // ── WebSocket ───────────────────────────────────────────────────
  useEffect(() => {
    let reconnectTimer = null

    function connect() {
      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen  = () => { setConnected(true); console.log('WS connected') }
        ws.onclose = () => {
          setConnected(false)
          reconnectTimer = setTimeout(connect, 3000)
        }
        ws.onerror = () => ws.close()

        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data)

          if (msg.type === 'metrics') {
            setLiveMetrics(prev => ({
              ...prev,
              [msg.data.endpoint]: msg.data,
            }))
          }

          if (msg.type === 'incident') {
            setIncidents(prev => [msg.data, ...prev.slice(0, 49)])
            setAlerts(prev => [msg.data, ...prev.slice(0, 9)])
            // auto-clear alert after 8s
            setTimeout(() => {
              setAlerts(prev => prev.filter(a => a.id !== msg.data.id))
            }, 8000)
          }

          if (msg.type === 'incident_resolved') {
            setIncidents(prev =>
              prev.map(i => i.id === msg.data.id ? msg.data : i)
            )
          }
        }
      } catch (_) {
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()
    fetchDashboard()
    const pollTimer = setInterval(fetchDashboard, 5000)

    return () => {
      clearInterval(pollTimer)
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [fetchDashboard])

  const resolveIncident = useCallback(async (id) => {
    try {
      await fetch(`${API_BASE}/api/incidents/${id}/resolve`, { method: 'POST' })
      setIncidents(prev => prev.map(i =>
        i.id === id ? { ...i, status: 'resolved', resolved_at: new Date().toISOString() } : i
      ))
    } catch (_) {}
  }, [])

  const triggerAnalysis = useCallback(async (endpoint) => {
    try {
      const r = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
      return await r.json()
    } catch (_) { return null }
  }, [])

  return { dashboard, incidents, liveMetrics, connected, alerts, resolveIncident, triggerAnalysis }
}
