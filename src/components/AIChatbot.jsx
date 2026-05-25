import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `You are ARIA (Autonomous Reliability Intelligence Agent), an expert AI assistant embedded inside a real-time API monitoring dashboard called AURION AI.

You have access to the current live dashboard state provided in each message. Your job is to:
- Answer questions about current API health, incidents, latency, error rates
- Explain root causes of failures in simple terms
- Give actionable debugging recommendations
- Predict potential future failures based on trends
- Help engineers prioritize which issues to fix first

Be concise, technical, and confident. Use emojis sparingly for severity indicators (🔴🟠🟡🟢).
Format numbers clearly. Always refer to real data from the dashboard context provided.
You are an expert DevOps/SRE AI — speak like one.`

// ✅ Backend URL — default localhost:8000
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function AIChatbot({ dashboard, incidents, liveMetrics, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `🛡 ARIA Online — Autonomous Reliability Intelligence Agent\n\nI'm analyzing your live infrastructure. Ask me anything:\n- "Which endpoint is most critical right now?"\n- "Why is the Payment Gateway failing?"\n- "What should I fix first?"\n- "Predict next failure"`,
    }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildContext = () => {
    const summary   = dashboard?.summary || {}
    const endpoints = dashboard?.endpoints || []
    const openInc   = (incidents || []).filter(i => i.status === 'open').slice(0, 10)

    return `
LIVE DASHBOARD STATE (as of ${new Date().toISOString()}):
System Health: ${summary.system_health || 'unknown'}
Total Endpoints: ${summary.total_endpoints ?? 'N/A'}
Healthy: ${summary.healthy_endpoints ?? 'N/A'}
Open Incidents: ${summary.open_incidents ?? 'N/A'}
Critical Alerts: ${summary.critical_alerts ?? 'N/A'}
Avg Latency: ${summary.avg_latency ?? 'N/A'}ms
Requests/min: ${summary.total_requests_pm ?? 'N/A'}

ENDPOINT STATUS:
${endpoints.length
  ? endpoints.map(e => `- ${e.endpoint}: ${e.health_status} | ${Math.round(e.latency_ms)}ms | ${(e.error_rate * 100).toFixed(1)}% errors | score:${e.anomaly_score}`).join('\n')
  : '- No endpoint data yet'}

LIVE METRICS (WebSocket):
${Object.keys(liveMetrics || {}).length
  ? Object.entries(liveMetrics).slice(0, 6).map(([k, v]) => `- ${k}: ${Math.round(v.latency_ms)}ms, HTTP ${v.status_code}, err:${(v.error_rate * 100).toFixed(1)}%`).join('\n')
  : '- Waiting for live data...'}

OPEN INCIDENTS (latest 10):
${openInc.length
  ? openInc.map(i => `- [${i.severity.toUpperCase()}] ${i.endpoint}: ${i.description} | ${i.analysis?.root_causes?.[0] || 'analyzing...'}`).join('\n')
  : '- No open incidents'}
`
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const context = buildContext()
      const history = messages
        .slice(-8)
        .filter((m, idx) => !(m.role === 'assistant' && idx === 0))

      const apiMessages = [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: `${context}\n\nUser question: ${userMsg}` },
      ]

      // ✅ FastAPI backend pe call — GROQ_API_KEY safe rehti hai server pe
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system:   SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      })

      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`)

      const data  = await res.json()
      const reply = data.content?.[0]?.text || '⚠️ Empty response from server.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])

    } catch (err) {
      console.error('ARIA chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Backend connect nahi hua!\n\nYeh karo:\n1. Terminal mein run karo:\n   uvicorn main:app --reload --port 8000\n\n2. Backend folder mein .env banao:\n   GROQ_API_KEY=gsk-xxxxxxxxxx\n\n3. Install karo agar nahi kiya:\n   pip install python-dotenv\n\nError: ${err.message}`,
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    'What needs immediate attention?',
    'Which endpoint has worst latency?',
    'Summarize all open incidents',
    'Predict next failure',
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      width: 420, height: 560,
      background: 'rgba(6,13,20,0.97)',
      border: '1px solid var(--neon-blue)',
      borderRadius: 16,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 60px rgba(0,212,255,0.2), 0 20px 60px rgba(0,0,0,0.8)',
      backdropFilter: 'blur(20px)',
      animation: 'fade-in-up 0.3s ease forwards',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(0,212,255,0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,212,255,0.05)',
        borderRadius: '16px 16px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 16px rgba(0,212,255,0.5)',
          }}>🤖</div>
          <div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 12, color: 'var(--neon-blue)', letterSpacing: 2 }}>
              ARIA
            </div>
            <div style={{ fontSize: 10, color: 'var(--neon-green)', fontFamily: 'Space Mono' }}>
              ● ONLINE — Powered by Groq
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-dim)', borderRadius: 6, width: 28, height: 28,
            cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user'
                ? '16px 16px 4px 16px'
                : '16px 16px 16px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,234,0.1))'
                : 'rgba(255,255,255,0.04)',
              border: msg.role === 'user'
                ? '1px solid rgba(0,212,255,0.3)'
                : '1px solid rgba(255,255,255,0.06)',
              fontSize: 13,
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 6, padding: '10px 14px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--neon-blue)',
                animation: `pulse-glow 1s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick questions ── */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => setInput(q)}
              style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 10,
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.25)',
                color: 'var(--neon-blue)', cursor: 'pointer',
                fontFamily: 'Space Mono', transition: 'all 0.2s',
              }}
            >{q}</button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(0,212,255,0.15)',
        display: 'flex', gap: 8,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask ARIA about your APIs..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '9px 14px',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--neon-blue)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: '9px 16px', borderRadius: 10,
            background: loading || !input.trim()
              ? 'rgba(0,212,255,0.1)'
              : 'linear-gradient(135deg, var(--neon-blue), var(--neon-cyan))',
            border: 'none',
            color: loading || !input.trim() ? 'var(--text-dim)' : 'var(--bg-void)',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 16, fontWeight: 700, transition: 'all 0.2s',
          }}
        >↑</button>
      </div>
    </div>
  )
}