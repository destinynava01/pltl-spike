// The oscilloscope: membrane voltage (mV) against time (ms), with the resting potential and threshold marked. The
// trace is the team's latest solved stretch of the current round; the newest point gets a glowing dot.
const T = [0, 10] // ms
const V = [-90, 40] // mV

export default function Scope({ trace, color = '#22d3ee', height = 170, labels = true, className = '' }) {
  const w = 320
  const h = 140
  const pad = { l: labels ? 30 : 6, r: 8, t: 8, b: labels ? 16 : 6 }
  const x = (t) => pad.l + ((t - T[0]) / (T[1] - T[0])) * (w - pad.l - pad.r)
  const y = (v) => pad.t + ((V[1] - v) / (V[1] - V[0])) * (h - pad.t - pad.b)
  const pts = trace ?? []
  const path = pts.map(([t, v], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  const peak = pts.reduce((m, p) => (p[1] > m[1] ? p : m), [0, -999])
  const line = (v, label, dash) => (
    <g key={label}>
      <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="#93a3bd" strokeOpacity="0.45" strokeDasharray={dash} strokeWidth="1" />
      {labels && <text x={pad.l - 3} y={y(v) + 3} textAnchor="end" fontSize="8" fill="#93a3bd">{v}</text>}
    </g>
  )
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ height }} className={`w-full ${className}`} role="img"
      aria-label={last ? `Voltage trace, now at ${last[1]} millivolts` : 'Voltage trace'}>
      <rect x={pad.l} y={pad.t} width={w - pad.l - pad.r} height={h - pad.t - pad.b} rx="4" fill="#060b16" stroke="#2a3a5c" />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={x(i + 1)} x2={x(i + 1)} y1={pad.t} y2={h - pad.b} stroke="#22d3ee" strokeOpacity="0.07" />)}
      {line(0, '0', '1 3')}
      {line(-55, 'threshold', '4 3')}
      {line(-70, 'rest', '')}
      {labels && (
        <>
          <text x={w - pad.r - 2} y={y(-55) - 3} textAnchor="end" fontSize="8" fill="#facc15" fillOpacity="0.85">threshold −55</text>
          <text x={w - pad.r - 2} y={y(-70) + 10} textAnchor="end" fontSize="8" fill="#93a3bd">rest −70</text>
          <text x={pad.l} y={h - 3} fontSize="8" fill="#93a3bd">0 ms</text>
          <text x={w - pad.r} y={h - 3} textAnchor="end" fontSize="8" fill="#93a3bd">10 ms</text>
        </>
      )}
      {path && <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="glow" />}
      {peak[1] > 0 && <circle cx={x(peak[0])} cy={y(peak[1])} r="3" fill="#facc15" />}
      {last && <circle cx={x(last[0])} cy={y(last[1])} r="4" fill={color} className="glow" />}
    </svg>
  )
}

// The synapse chain: each link the team has worked out, in order
export function Chain({ links, example, compact = false }) {
  if (!links) return null
  return (
    <div>
      {example && !compact && <p className="text-xs text-muted">{example === 'nmj' ? 'Neuromuscular junction · acetylcholine' : 'Dopamine synapse · neuron to neuron'}</p>}
      <ol className={`mt-1 space-y-1 ${compact ? 'text-xs' : 'text-sm'}`}>
        {links.map((l, i) => (
          <li key={i} className="flex gap-2 rounded-md bg-panel px-2 py-1">
            <span className="font-display font-bold text-accent">{i + 1}</span>
            <span>{l}</span>
          </li>
        ))}
        <li className="rounded-md border border-dashed border-line px-2 py-1 text-muted">?</li>
      </ol>
    </div>
  )
}
