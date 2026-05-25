const SEV_COLOR = {
  critical: 'var(--critical)',
  high:     'var(--high)',
  medium:   'var(--medium)',
  low:      'var(--low)',
}
const SEV_ICON = {
  critical: '🔴',
  high:     '🟠',
  medium:   '🟡',
  low:      '🟢',
}

export default function AlertToasts({ alerts, onResolve }) {
  return (
    <div style={{
      position: 'fixed', top: 80, right: 20, zIndex: 1000,
      display: 'flex', flexDirection: 'column', gap: 8,
      width: 360,
    }}>
      {alerts.map(a => (
        <div key={a.id} className="animate-slide-right" style={{
          background: 'rgba(10,21,32,0.97)',
          border: `1px solid ${SEV_COLOR[a.severity] || 'var(--border)'}`,
          borderLeft: `4px solid ${SEV_COLOR[a.severity] || 'var(--border)'}`,
          borderRadius: 8,
          padding: '12px 14px',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 0 20px ${SEV_COLOR[a.severity]}44`,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <span>{SEV_ICON[a.severity]}</span>
                <span className="font-mono" style={{
                  fontSize: 10, color: SEV_COLOR[a.severity], textTransform:'uppercase', fontWeight:700
                }}>{a.severity}</span>
                <span className="font-mono" style={{ fontSize: 10, color:'var(--text-dim)' }}>#{a.id}</span>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>
                {a.endpoint}
              </div>
              <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.4 }}>
                {a.description}
              </div>
            </div>
            <button onClick={() => onResolve(a.id)} style={{
              background: 'rgba(0,212,255,0.1)', border:'1px solid var(--neon-blue)',
              color:'var(--neon-blue)', borderRadius:4, padding:'4px 8px',
              fontSize:10, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'Space Mono',
            }}>RESOLVE</button>
          </div>
          {a.analysis?.recommendations?.[0] && (
            <div style={{
              marginTop: 8, padding: '6px 8px',
              background: 'rgba(0,212,255,0.05)',
              borderRadius: 4, fontSize:11, color:'var(--text-secondary)',
            }}>
              💡 {a.analysis.recommendations[0]}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
