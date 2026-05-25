import { useState } from 'react'

const SEV_COLOR = {
  critical: 'var(--critical)',
  high:     'var(--high)',
  medium:   'var(--medium)',
  low:      'var(--low)',
}

export default function IncidentsPanel({ incidents, onResolve }) {
  const [selected, setSelected] = useState(null)
  const [filter,   setFilter]   = useState('all')

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.status === filter || i.severity === filter)

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg-deep)',
      }}>
        <h2 className="font-title" style={{ fontSize:14, color:'var(--neon-blue)', letterSpacing:2 }}>
          INCIDENT LOG
        </h2>
        <div style={{ display:'flex', gap:6 }}>
          {['all','open','resolved','critical'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'3px 10px', borderRadius:4, fontSize:10,
              background: filter===f ? 'var(--neon-blue)' : 'transparent',
              color: filter===f ? 'var(--bg-void)' : 'var(--text-secondary)',
              border: `1px solid ${filter===f ? 'var(--neon-blue)' : 'var(--border)'}`,
              cursor: 'pointer', fontFamily: 'Space Mono', textTransform:'uppercase',
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* List */}
        <div style={{ flex:1, overflowY:'auto', minWidth:0 }}>
          {filtered.length === 0 && (
            <div style={{ padding:40, textAlign:'center', color:'var(--text-dim)', fontFamily:'Space Mono', fontSize:12 }}>
              ✓ NO INCIDENTS
            </div>
          )}
          {filtered.map((inc, idx) => (
            <div key={inc.id} onClick={() => setSelected(selected?.id===inc.id ? null : inc)}
              className="animate-fade-in-up"
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: selected?.id===inc.id ? 'var(--bg-card-hover)' : 'transparent',
                borderLeft: `3px solid ${inc.status==='resolved' ? 'var(--text-dim)' : SEV_COLOR[inc.severity]||'var(--border)'}`,
                animationDelay: `${idx * 0.03}s`,
                transition: 'background 0.2s',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                    <span className="font-mono" style={{
                      fontSize:9, padding:'2px 6px', borderRadius:2,
                      background: inc.status==='resolved' ? 'rgba(100,100,100,0.2)' : `${SEV_COLOR[inc.severity]}22`,
                      color: inc.status==='resolved' ? 'var(--text-dim)' : SEV_COLOR[inc.severity],
                      textTransform:'uppercase', letterSpacing:1,
                    }}>{inc.severity}</span>
                    <span className="font-mono" style={{ fontSize:10, color:'var(--text-dim)' }}>#{inc.id}</span>
                    {inc.status==='resolved' && (
                      <span className="font-mono" style={{ fontSize:9, color:'var(--neon-green)' }}>✓ RESOLVED</span>
                    )}
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500, marginBottom:2,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {inc.endpoint}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.4 }}>
                    {inc.description}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div className="font-mono" style={{ fontSize:10, color:'var(--text-dim)', marginBottom:6 }}>
                    {new Date(inc.timestamp).toLocaleTimeString()}
                  </div>
                  {inc.status === 'open' && (
                    <button onClick={e => { e.stopPropagation(); onResolve(inc.id) }} style={{
                      padding:'3px 8px', borderRadius:4, fontSize:10,
                      background:'transparent', border:'1px solid var(--neon-green)',
                      color:'var(--neon-green)', cursor:'pointer', fontFamily:'Space Mono',
                    }}>ACK</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            width: 280, borderLeft:'1px solid var(--border)',
            overflowY:'auto', background:'var(--bg-deep)', padding:16,
          }}>
            <div className="font-mono" style={{ fontSize:10, color:'var(--neon-blue)', marginBottom:12, letterSpacing:2 }}>
              INCIDENT DETAILS
            </div>

            <Section title="ROOT CAUSES" items={selected.analysis?.root_causes} color="var(--neon-orange)" />
            <Section title="AI RECOMMENDATIONS" items={selected.analysis?.recommendations} color="var(--neon-cyan)" />
            <Section title="ISSUES DETECTED" items={selected.analysis?.issues} color="var(--neon-yellow)" />

            {selected.metrics && (
              <div>
                <div className="font-mono" style={{ fontSize:9, color:'var(--text-dim)', marginBottom:8, letterSpacing:1 }}>
                  SNAPSHOT METRICS
                </div>
                <div style={{ display:'grid', gap:4 }}>
                  {[
                    ['Latency', `${Math.round(selected.metrics.latency_ms)}ms`],
                    ['Status', selected.metrics.status_code],
                    ['Error Rate', `${(selected.metrics.error_rate*100).toFixed(1)}%`],
                    ['CPU', `${selected.metrics.cpu_usage}%`],
                    ['Memory', `${selected.metrics.memory_usage}%`],
                    ['Confidence', `${Math.round((selected.analysis?.confidence||0)*100)}%`],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between',
                      padding:'4px 8px', background:'var(--bg-card)', borderRadius:4 }}>
                      <span className="font-mono" style={{ fontSize:10, color:'var(--text-dim)' }}>{k}</span>
                      <span className="font-mono" style={{ fontSize:10, color:'var(--text-primary)', fontWeight:700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.analysis?.analysis_type && (
              <div style={{ marginTop:12, padding:'6px 10px', background:'rgba(0,212,255,0.05)',
                borderRadius:6, border:'1px solid rgba(0,212,255,0.1)' }}>
                <span className="font-mono" style={{ fontSize:9, color:'var(--neon-blue)' }}>
                  {selected.analysis.analysis_type === 'ai-powered' ? '🤖 AI-POWERED ANALYSIS' : '⚙ RULE-BASED ANALYSIS'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, items = [], color }) {
  if (!items?.length) return null
  return (
    <div style={{ marginBottom:16 }}>
      <div className="font-mono" style={{ fontSize:9, color:'var(--text-dim)', letterSpacing:1, marginBottom:6 }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{
          padding:'6px 10px', marginBottom:4, borderRadius:6,
          background:`${color}11`, border:`1px solid ${color}33`,
          fontSize:11, color:'var(--text-secondary)', lineHeight:1.5,
        }}>
          <span style={{ color, marginRight:6 }}>›</span>{item}
        </div>
      ))}
    </div>
  )
}
