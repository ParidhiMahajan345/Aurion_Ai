
import { useState, useEffect } from 'react'
import { useAgentData } from './hooks/useAgentData'
import EndpointCard from './components/EndpointCard'
import IncidentsPanel from './components/IncidentsPanel'
import AlertToasts from './components/AlertToasts'
import AIChatbot from './components/AIChatbot'
import Sparkline from './components/Sparkline'
import { generatePDFReport } from './utils/pdfReport'

// ── Boot screen ──────────────────────────────────────────────────────
function BootScreen({ onDone }) {
  const [lines, setLines] = useState([])

  const bootLines = [
    '> Initializing Aurion AI v2.0...',
    '> Loading anomaly detection engine...',
    '> Connecting to API monitoring pipelines...',
    '> Starting Claude AI analysis module...',
    '> WebSocket broadcaster online...',
    '> All systems nominal. Launching dashboard.',
  ]

  useEffect(() => {
    let i = 0

    const t = setInterval(() => {
      setLines(prev => [...prev, bootLines[i]])
      i++

      if (i >= bootLines.length) {
        clearInterval(t)
        setTimeout(onDone, 700)
      }
    }, 320)

    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        width: 500,
        maxWidth: '90%',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 28,
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 60 }}>🛡</div>

          <div className="font-title" style={{
            color: 'var(--neon-blue)',
            fontSize: 22,
            letterSpacing: 4,
            marginTop: 10,
          }}>
            Aurion AI
          </div>
        </div>

        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: 'var(--neon-green)',
              fontFamily: 'Space Mono',
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            {line}
          </div>
        ))}

        {lines.length < bootLines.length && (
          <div style={{
            color: 'var(--neon-blue)',
            marginTop: 8,
            fontSize: 14,
          }}>
            ▮
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stat card ────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color = 'var(--neon-blue)',
  icon,
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${color}33`,
      borderRadius: 12,
      padding: 18,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />

      <div style={{ fontSize: 26, marginBottom: 6 }}>
        {icon}
      </div>

      <div
        className="font-mono"
        style={{
          color,
          fontSize: 30,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {value ?? '—'}
      </div>

      <div style={{
        fontSize: 12,
        color: 'var(--text-secondary)',
      }}>
        {label}
      </div>

      {sub && (
        <div
          className="font-mono"
          style={{
            marginTop: 4,
            fontSize: 10,
            color: 'var(--text-dim)',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Clock ────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(id)
  }, [])

  return (
    <span
      className="font-mono"
      style={{
        fontSize: 11,
        color: 'var(--text-dim)',
      }}
    >
      {time.toUTCString().replace('GMT', 'UTC')}
    </span>
  )
}

// ── Latency overview ─────────────────────────────────────────────────
function LatencyOverview({ dashboard }) {
  if (!dashboard?.latency_chart) return null

  const entries = Object.entries(dashboard.latency_chart).slice(0, 5)

  const COLORS = [
    'var(--neon-blue)',
    'var(--neon-cyan)',
    'var(--neon-green)',
    'var(--neon-orange)',
    'var(--neon-purple)',
  ]

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <h3
          className="font-title"
          style={{
            fontSize: 12,
            color: 'var(--neon-blue)',
            letterSpacing: 2,
          }}
        >
          LATENCY OVERVIEW
        </h3>

        <span
          className="font-mono"
          style={{
            fontSize: 10,
            color: 'var(--text-dim)',
          }}
        >
          LIVE
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {entries.map(([name, data], i) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 120,
              fontSize: 11,
              color: 'var(--text-secondary)',
              fontFamily: 'Space Mono',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {name}
            </div>

            <Sparkline
              data={data}
              color={COLORS[i % COLORS.length]}
              width={260}
              height={30}
            />

            <div
              className="font-mono"
              style={{
                width: 60,
                textAlign: 'right',
                fontSize: 12,
                color: COLORS[i % COLORS.length],
              }}
            >
              {data.length
                ? Math.round(data[data.length - 1])
                : 0}ms
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const {
    dashboard,
    incidents,
    liveMetrics,
    connected,
    alerts,
    resolveIncident,
  } = useAgentData()

  const [activeTab, setActiveTab] = useState('overview')
  const [showChat, setShowChat] = useState(false)
  const [booting, setBooting] = useState(true)

  const summary = dashboard?.summary || {}

  if (booting) {
    return <BootScreen onDone={() => setBooting(false)} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      <AlertToasts
        alerts={alerts}
        onResolve={resolveIncident}
      />

      {showChat && (
        <AIChatbot
          dashboard={dashboard}
          incidents={incidents}
          liveMetrics={liveMetrics}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Floating AI Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: 'none',
            background:
              'linear-gradient(135deg, var(--neon-blue), var(--neon-cyan))',
            fontSize: 24,
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 0 24px rgba(0,212,255,0.5)',
          }}
        >
          🤖
        </button>
      )}

      {/* Header */}
      <header style={{
        height: 64,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(6,13,20,0.95)',
        backdropFilter: 'blur(18px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background:
                'linear-gradient(135deg, var(--neon-blue), var(--neon-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}>
              🛡
            </div>

            <div>
              <div
                className="font-title"
                style={{
                  fontSize: 13,
                  color: 'var(--neon-blue)',
                  letterSpacing: 3,
                }}
              >
                Aurion AI
              </div>

              <div style={{
                fontSize: 9,
                color: 'var(--text-dim)',
                fontFamily: 'Space Mono',
              }}>
                API FAILURE DETECTION AGENT
              </div>
            </div>
          </div>

          <nav style={{
            display: 'flex',
            gap: 4,
          }}>
            {[
              { id: 'overview', label: 'OVERVIEW' },
              { id: 'endpoints', label: 'ENDPOINTS' },
              { id: 'incidents', label: 'INCIDENTS' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border:
                    activeTab === tab.id
                      ? '1px solid var(--neon-blue)'
                      : '1px solid transparent',
                  background:
                    activeTab === tab.id
                      ? 'rgba(0,212,255,0.12)'
                      : 'transparent',
                  color:
                    activeTab === tab.id
                      ? 'var(--neon-blue)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'Space Mono',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <LiveClock />

          <button
            onClick={() =>
              generatePDFReport(dashboard, incidents)
            }
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid rgba(191,95,255,0.4)',
              background: 'rgba(191,95,255,0.1)',
              color: 'var(--neon-purple)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            📄 EXPORT PDF
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background:
                connected
                  ? 'var(--neon-green)'
                  : 'var(--critical)',
            }} />

            <span
              className="font-mono"
              style={{
                fontSize: 10,
                color:
                  connected
                    ? 'var(--neon-green)'
                    : 'var(--critical)',
              }}
            >
              {connected ? 'LIVE' : 'RECONNECTING'}
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main style={{
        flex: 1,
        padding: 24,
        maxWidth: 1600,
        width: '100%',
        margin: '0 auto',
      }}>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
            }}>
              <StatCard
                label="MONITORED ENDPOINTS"
                value={summary.total_endpoints}
                sub={`${summary.healthy_endpoints} healthy`}
                color="var(--neon-blue)"
                icon="📡"
              />

              <StatCard
                label="OPEN INCIDENTS"
                value={summary.open_incidents}
                sub="Needs attention"
                color="var(--critical)"
                icon="🚨"
              />

              <StatCard
                label="CRITICAL ALERTS"
                value={summary.critical_alerts}
                sub="Immediate action"
                color="var(--critical)"
                icon="⚡"
              />

              <StatCard
                label="AVG LATENCY"
                value={`${summary.avg_latency}ms`}
                sub="Across all APIs"
                color="var(--neon-green)"
                icon="⏱"
              />

              <StatCard
                label="REQUESTS / MIN"
                value={
                  (summary.total_requests_pm || 0).toLocaleString()
                }
                sub="Live traffic"
                color="var(--neon-purple)"
                icon="📊"
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 16,
            }}>
              <LatencyOverview dashboard={dashboard} />

              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 20,
              }}>
                <h3
                  className="font-title"
                  style={{
                    fontSize: 12,
                    color: 'var(--neon-blue)',
                    letterSpacing: 2,
                    marginBottom: 16,
                  }}
                >
                  RECENT INCIDENTS
                </h3>

                {incidents.slice(0, 6).map(inc => (
                  <div
                    key={inc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom:
                        '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span style={{
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                    }}>
                      {inc.endpoint}
                    </span>

                    <span
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        color: 'var(--critical)',
                      }}
                    >
                      {inc.severity?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 14,
            }}>
              {(dashboard?.endpoints || [])
                .slice(0, 4)
                .map(ep => (
                  <EndpointCard
                    key={ep.endpoint}
                    endpoint={ep}
                    live={liveMetrics[ep.endpoint]}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Endpoints */}
        {activeTab === 'endpoints' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {(dashboard?.endpoints || []).map(ep => (
              <EndpointCard
                key={ep.endpoint}
                endpoint={ep}
                live={liveMetrics[ep.endpoint]}
              />
            ))}
          </div>
        )}

        {/* Incidents */}
        {activeTab === 'incidents' && (
          <div style={{
            height: 'calc(100vh - 130px)',
          }}>
            <IncidentsPanel
              incidents={incidents}
              onResolve={resolveIncident}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '10px 24px',
        background: 'var(--bg-deep)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span
          className="font-mono"
          style={{
            fontSize: 9,
            color: 'var(--text-dim)',
          }}
        >
          Aurion AI v2.0
        </span>

        <span
          className="font-mono"
          style={{
            fontSize: 9,
            color:
              connected
                ? 'var(--neon-green)'
                : 'var(--critical)',
          }}
        >
          {connected
            ? '● LIVE MONITORING ACTIVE'
            : '○ RECONNECTING...'}
        </span>
      </footer>
    </div>
  )
}

