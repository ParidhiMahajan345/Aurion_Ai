/**
 * Generates a styled HTML-based PDF incident report
 * Uses browser's print-to-PDF capability
 */
export function generatePDFReport(dashboard, incidents) {
  const summary  = dashboard?.summary  || {}
  const endpoints = dashboard?.endpoints || []
  const now = new Date()

  const sevColor = { critical: '#ff3355', high: '#ff8800', medium: '#ffdd00', low: '#00ff88' }
  const healthColor = { healthy: '#00ff88', degraded: '#ffdd00', warning: '#ff8800', critical: '#ff3355' }

  const openInc    = incidents.filter(i => i.status === 'open')
  const resolvedInc = incidents.filter(i => i.status === 'resolved')
  const criticalInc = openInc.filter(i => i.severity === 'critical')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Aurion AI — Incident Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a2e; font-size: 13px; }
    .page { max-width: 900px; margin: 0 auto; padding: 40px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start;
      padding-bottom: 24px; border-bottom: 3px solid #00d4ff; margin-bottom: 32px; }
    .logo { display: flex; align-items: center; gap: 14px; }
    .logo-icon { width: 52px; height: 52px; background: linear-gradient(135deg,#00d4ff,#00ff88);
      border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
    .logo-text h1 { font-family: 'JetBrains Mono'; font-size: 20px; color: #00d4ff; letter-spacing: 3px; }
    .logo-text p { font-size: 11px; color: #666; letter-spacing: 1px; margin-top: 2px; }
    .report-meta { text-align: right; }
    .report-meta .report-id { font-family: 'JetBrains Mono'; font-size: 13px; color: #00d4ff; }
    .report-meta .report-date { font-size: 11px; color: #888; margin-top: 4px; }

    /* System health banner */
    .health-banner { padding: 16px 20px; border-radius: 10px; margin-bottom: 28px;
      display: flex; align-items: center; gap: 12; border-left: 5px solid;
      ${summary.system_health === 'critical' ? 'background:#fff0f3;border-color:#ff3355;' :
        summary.system_health === 'degraded' ? 'background:#fffbf0;border-color:#ff8800;' :
        'background:#f0fff8;border-color:#00ff88;'} }
    .health-dot { width: 14px; height: 14px; border-radius: 50;
      background: ${summary.system_health === 'critical' ? '#ff3355' : summary.system_health === 'degraded' ? '#ff8800' : '#00ff88'}; }
    .health-text { font-size: 15px; font-weight: 700; color: #1a1a2e; }
    .health-sub { font-size: 11px; color: #666; margin-top: 2px; }

    /* Stats grid */
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 32px; }
    .stat-card { background: #f8faff; border: 1px solid #e0e8ff; border-radius: 10px;
      padding: 16px 12px; text-align: center; }
    .stat-value { font-family: 'JetBrains Mono'; font-size: 26px; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 10px; color: #888; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }

    /* Section title */
    .section-title { font-family: 'JetBrains Mono'; font-size: 12px; letter-spacing: 3px;
      color: #00d4ff; text-transform: uppercase; margin-bottom: 14px; padding-bottom: 8px;
      border-bottom: 1px solid #e0e8ff; display: flex; align-items: center; gap: 8px; }

    /* Incidents table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    th { background: #f0f8ff; font-family: 'JetBrains Mono'; font-size: 10px;
      letter-spacing: 1px; color: #555; padding: 10px 12px; text-align: left;
      border-bottom: 2px solid #e0e8ff; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 12px; vertical-align: top; }
    tr:hover td { background: #f8faff; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; letter-spacing: 1px; }

    /* Endpoint cards */
    .ep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
    .ep-card { border: 1px solid #e0e8ff; border-radius: 10px; padding: 14px; position: relative; }
    .ep-card .ep-name { font-weight: 600; font-size: 13px; margin-bottom: 8px; }
    .ep-metrics { display: flex; gap: 14px; flex-wrap: wrap; }
    .ep-metric span { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 700; }
    .ep-metric label { font-size: 10px; color: #888; display: block; margin-top: 1px; }

    /* Recommendations */
    .rec-list { list-style: none; }
    .rec-list li { padding: 10px 14px; margin-bottom: 8px; border-radius: 8px;
      border-left: 4px solid #00d4ff; background: #f0f9ff; font-size: 12px; line-height: 1.5; }
    .rec-list li::before { content: '→ '; color: #00d4ff; font-weight: 700; }

    /* Footer */
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e8ff;
      display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo">
      <div class="logo-icon">🛡</div>
      <div class="logo-text">
        <h1>Aurion AI</h1>
        <p>API FAILURE DETECTION & DEBUGGING AGENT</p>
      </div>
    </div>
    <div class="report-meta">
      <div class="report-id">REPORT #${Math.random().toString(36).slice(2,8).toUpperCase()}</div>
      <div class="report-date">Generated: ${now.toLocaleString()}</div>
      <div class="report-date">Period: Last ${incidents.length} incidents captured</div>
    </div>
  </div>

  <!-- Health Banner -->
  <div class="health-banner">
    <div class="health-dot"></div>
    <div>
      <div class="health-text">SYSTEM ${(summary.system_health || 'UNKNOWN').toUpperCase()}</div>
      <div class="health-sub">${summary.open_incidents} open incidents · ${summary.critical_alerts} critical · ${summary.healthy_endpoints}/${summary.total_endpoints} endpoints healthy</div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value" style="color:#00d4ff">${summary.total_endpoints || 0}</div>
      <div class="stat-label">Monitored</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#00ff88">${summary.healthy_endpoints || 0}</div>
      <div class="stat-label">Healthy</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:${summary.open_incidents > 0 ? '#ff3355' : '#00ff88'}">${summary.open_incidents || 0}</div>
      <div class="stat-label">Open Incidents</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#ff8800">${summary.avg_latency || 0}ms</div>
      <div class="stat-label">Avg Latency</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#bf5fff">${(summary.total_requests_pm || 0).toLocaleString()}</div>
      <div class="stat-label">Req / Min</div>
    </div>
  </div>

  <!-- Open Incidents -->
  <div class="section-title">⚠ OPEN INCIDENTS (${openInc.length})</div>
  ${openInc.length === 0
    ? '<p style="color:#00c97a;padding:14px;background:#f0fff8;border-radius:8px;margin-bottom:28px;">✓ No open incidents — all systems operational</p>'
    : `<table>
      <tr><th>ID</th><th>SEVERITY</th><th>ENDPOINT</th><th>DESCRIPTION</th><th>ROOT CAUSE</th><th>TIME</th></tr>
      ${openInc.slice(0, 20).map(i => `
      <tr>
        <td><span style="font-family:JetBrains Mono;font-size:11px;color:#666">#${i.id}</span></td>
        <td><span class="badge" style="background:${sevColor[i.severity]}22;color:${sevColor[i.severity]}">${i.severity.toUpperCase()}</span></td>
        <td style="font-weight:600">${i.endpoint}</td>
        <td style="color:#555">${i.description}</td>
        <td style="color:#888;font-size:11px">${i.analysis?.root_causes?.[0] || '—'}</td>
        <td style="font-family:JetBrains Mono;font-size:11px;color:#aaa">${new Date(i.timestamp).toLocaleTimeString()}</td>
      </tr>`).join('')}
    </table>`}

  <!-- Endpoint Status -->
  <div class="section-title">📡 ENDPOINT STATUS</div>
  <div class="ep-grid">
    ${endpoints.slice(0, 8).map(ep => `
    <div class="ep-card" style="border-top:3px solid ${healthColor[ep.health_status]||'#ccc'}">
      <div class="ep-name">${ep.endpoint}</div>
      <div style="margin-bottom:8px">
        <span class="badge" style="background:${healthColor[ep.health_status]}22;color:${healthColor[ep.health_status]}">${(ep.health_status||'unknown').toUpperCase()}</span>
        ${ep.critical ? '<span class="badge" style="background:#ff335522;color:#ff3355;margin-left:6px">CRITICAL SVC</span>' : ''}
      </div>
      <div class="ep-metrics">
        <div class="ep-metric"><span style="color:${ep.latency_ms>500?'#ff3355':ep.latency_ms>200?'#ff8800':'#00c97a'}">${Math.round(ep.latency_ms)}ms</span><label>Latency</label></div>
        <div class="ep-metric"><span style="color:${ep.error_rate>0.1?'#ff3355':'#555'}">${(ep.error_rate*100).toFixed(1)}%</span><label>Error Rate</label></div>
        <div class="ep-metric"><span style="color:#00d4ff">${ep.status_code}</span><label>HTTP</label></div>
        <div class="ep-metric"><span style="color:#888">${(ep.requests_per_min||0).toLocaleString()}</span><label>Req/min</label></div>
      </div>
    </div>`).join('')}
  </div>

  <!-- AI Recommendations -->
  ${criticalInc.length > 0 ? `
  <div class="section-title">🤖 AI DEBUGGING RECOMMENDATIONS</div>
  <ul class="rec-list">
    ${[...new Set(criticalInc.flatMap(i => i.analysis?.recommendations || []))].slice(0,6).map(r => `<li>${r}</li>`).join('')}
  </ul>` : ''}

  <!-- Resolved -->
  ${resolvedInc.length > 0 ? `
  <div class="section-title">✓ RESOLVED INCIDENTS (${resolvedInc.length})</div>
  <table>
    <tr><th>ID</th><th>ENDPOINT</th><th>SEVERITY</th><th>RESOLVED AT</th></tr>
    ${resolvedInc.slice(0,10).map(i => `
    <tr>
      <td style="font-family:JetBrains Mono;font-size:11px;color:#666">#${i.id}</td>
      <td>${i.endpoint}</td>
      <td><span class="badge" style="background:#eee;color:#888">${i.severity.toUpperCase()}</span></td>
      <td style="font-family:JetBrains Mono;font-size:11px;color:#aaa">${i.resolved_at ? new Date(i.resolved_at).toLocaleTimeString() : '—'}</td>
    </tr>`).join('')}
  </table>` : ''}

  <!-- Footer -->
  <div class="footer">
    <span>Aurion AI v2.0 — AI-Powered API Failure Detection & Debugging Agent</span>
    <span>CONFIDENTIAL — Internal DevOps Report</span>
  </div>

</div>
</body>
</html>`

  // Open in new window and trigger print-to-PDF
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 800)
}
