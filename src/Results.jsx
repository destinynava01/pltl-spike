import { useEffect, useState } from 'react'
import { spkGame } from './api'
import { Button, Label, Paper, Stamp } from './ui'

// After the game: teams ranked by points, and each team's whole run with every answer and explanation, how many wrong
// tries each step took, and the results download.
export default function Results({ session, onNewGame, onLobby }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => { spkGame({ action: 'report', game_id: session.gameId, host_token: session.hostToken }).then(setReport).catch((e) => setError(e.message)) }, [session])

  async function download() {
    setDownloading(true)
    try {
      const { downloadResults } = await import('./gameResults')
      await downloadResults(report)
    } catch (e) {
      setError(e.message || 'Could not download the results.')
    } finally {
      setDownloading(false)
    }
  }

  if (!report) return <main className="lab-bg flex min-h-dvh items-center justify-center"><p className="font-display text-muted">{error || 'Reading the traces…'}</p></main>
  const ranked = [...report.teams].sort((a, b) => b.points - a.points)
  const medal = ['🥇', '🥈', '🥉']

  return (
    <main className="lab-bg min-h-dvh p-4 text-ink sm:p-8">
      <Paper className="mx-auto max-w-4xl text-center">
        <Stamp className="text-3xl">Game over</Stamp>
        <h1 className="mt-4 font-display text-5xl font-bold text-accent">The Readout</h1>

        <ol className="mx-auto mt-6 max-w-2xl space-y-3 text-left">
          {ranked.map((t, i) => (
            <li key={t.index}>
              <button type="button" onClick={() => setOpen(open === t.index ? null : t.index)} className="w-full rounded-lg border border-line bg-panel p-4 text-left hover:bg-hover" style={{ borderLeft: `8px solid ${t.color}` }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-2xl font-semibold">{medal[i] ?? `#${i + 1}`} {t.name}</p>
                  <p className="font-display text-3xl font-bold text-spike">{t.points}</p>
                </div>
                <p className="mt-1 text-sm text-muted">{t.solved}/{t.total} steps{t.finish_rank ? ` · finished #${t.finish_rank}` : ''}{t.example ? ` · synapse: ${t.example}` : ''}</p>
                <p className="mt-1 text-sm font-bold text-accent">{open === t.index ? 'Hide the run ▲' : 'See the whole run ▼'}</p>
              </button>
              {open === t.index && (
                <ol className="mt-2 space-y-2">
                  {t.steps.map((s, k) => (
                    <li key={k} className="rounded-lg border border-line bg-card p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold">{s.round}: {s.title}</p>
                        <p className={`shrink-0 font-bold ${s.status === 'solved' ? 'text-ok' : s.status === 'shown' ? 'text-warn' : 'text-muted'}`}>{s.status === 'solved' ? `+${s.points}` : s.status}</p>
                      </div>
                      <p className="mt-1 text-muted">{s.prompt}</p>
                      <Label className="mt-1">Answer</Label>
                      <p className="text-accent">{s.answer}</p>
                      {s.wrong > 0 && <p className="mt-1 text-bad">{s.wrong} wrong tr{s.wrong === 1 ? 'y' : 'ies'}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-8 grid max-w-md gap-2 sm:grid-cols-2">
          <Button variant="fire" disabled={downloading} onClick={download}>{downloading ? 'Preparing…' : '⬇️ Results (.xlsx)'}</Button>
          <Button onClick={onNewGame}>New game</Button>
        </div>
        <p className="mt-2 text-sm text-muted">Download before starting a new game. New game closes this one, and game data is cleared after 8 hours.</p>
        <button type="button" onClick={onLobby} className="mt-2 text-sm font-bold text-accent">Back to the lobby</button>
        {error && <p className="mt-2 font-bold text-bad">{error}</p>}
      </Paper>
    </main>
  )
}
