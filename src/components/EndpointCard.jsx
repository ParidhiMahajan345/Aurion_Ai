import Sparkline from './Sparkline'

const HEALTH_COLOR = {
  healthy:  'var(--healthy)',
  degraded: 'var(--degraded)',
  warning:  'var(--warning)',
  critical: 'var(--critical)',
}
const HEALTH_BG = {
  healthy:  'rgba(0,255,136,0.08)',
  degraded: 'rgba(255,221,0,0.08)',
  warning:  'rgba(255,136,0,0.08)',
  critical: 'rgba(255,51,85,0.08)',
}

export default function EndpointCard({ endpoint, live }) {
  const data = live || endpoint
  const health = data.health_status || 'healthy'
  const color  = HEALTH_COLOR[health]
  const trend  = endpoint.trend || []

  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       `1px solid ${color}44`,
      borderTop:    `2px solid ${color}`,
      borderRadius: 10,
      padding:      16,
      transition:   'all 0.3s',
      cursor:       'default',
      position:     'relative',
      overflow:     'hidden',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background    = 'var(--bg-card-hover)'
      e.currentTarget.style.boxShadow     = `0 0 24px ${color}33`
      e.currentTarget.style.transform     = 'translateY(-2px)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background    = 'var(--bg-card)'
      e.currentTarget.style.boxShadow     = 'none'
      e.currentTarget.style.transform     = 'translateY(0)'
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{
            fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:2,
            fontFamily:'Space Mono',
          }}>
            {data.endpoint}
          </div>
          {endpoint.critical && (
            <span style={{
              fontSize:9, padding:'2px 6px', borderRadius:2,
              background:'rgba(255,51,85,0.15)', color:'var(--critical)',
              fontFamily:'Space Mono', letterSpacing:1,
            }}>CRITICAL SVC</span>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          <span style={{
            fontSize:10, padding:'3px 8px', borderRadius:4,
            background: HEALTH_BG[health],
            color, fontFamily:'Space Mono', fontWeight:700, letterSpacing:1,
            textTransform:'uppercase',
          }}>{health}</span>
          <span className="font-mono" style={{ fontSize:10, color:'var(--text-dim)' }}>
            {data.status_code}
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        <Metric label="LATENCY" value={`${Math.round(data.latency_ms || 0)}ms`}
          color={data.latency_ms > 500 ? 'var(--critical)' : data.latency_ms > 200 ? 'var(--warning)' : 'var(--neon-green)'} />
        <Metric label="ERROR RATE" value={`${((data.error_rate || 0)*100).toFixed(1)}%`}
          color={data.error_rate > 0.1 ? 'var(--critical)' : data.error_rate > 0.02 ? 'var(--warning)' : 'var(--neon-green)'} />
        <Metric label="REQ/MIN" value={(data.requests_per_min || 0).toLocaleString()}
          color="var(--neon-blue)" />
        <Metric label="ANOMALY" value={`${Math.round((data.anomaly_score || 0)*100)}%`}
          color={data.anomaly_score > 0.6 ? 'var(--critical)' : 'var(--text-secondary)'} />
      </div>

      {/* Sparkline */}
      {trend.length > 2 && (
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:9, color:'var(--text-dim)', fontFamily:'Space Mono', marginBottom:4 }}>
            LATENCY TREND (LAST {trend.length} SAMPLES)
          </div>
          <Sparkline data={trend} color={color} width={220} height={36} />
        </div>
      )}

      {/* Pulse indicator */}
      {health !== 'healthy' && (
        <div className="animate-pulse-glow" style={{
          position:'absolute', top:10, right:10,
          width:8, height:8, borderRadius:'50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }} />
      )}
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div style={{ background:'var(--bg-deep)', borderRadius:6, padding:'8px 10px' }}>
      <div style={{ fontSize:9, color:'var(--text-dim)', fontFamily:'Space Mono', marginBottom:3 }}>
        {label}
      </div>
      <div style={{ fontSize:16, fontWeight:700, color, fontFamily:'Space Mono' }}>
        {value}
      </div>
    </div>
  )
}
