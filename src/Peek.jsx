import { useEffect, useState } from 'react'
import { roundOf } from './config'
import { Button, Label } from './ui'
import ReportProblem from './ReportProblem'

// The leader's peek at one team: the step it's on (with the choices its phones show), the lead, every pick tried on
// this step, and how the earlier steps went. The answer stays behind a button, since the board is often on the
// projector. Refreshes whenever the board does (`stamp` changes).
export default function Peek({ call, team, stamp, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [shownFor, setShownFor] = useState(null) // the step the answer was shown for (a new step hides it again)

  useEffect(() => {
    call({ action: 'peek', team_index: team.index }).then((d) => { setData(d); setError('') }).catch((e) => setError(e.message))
  }, [call, team.index, stamp])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const c = data?.case
  const cur = c?.file.current
  const step = c?.step
  const showAnswer = shownFor !== null && shownFor === step
  const text = (f, id) => f.choices.find((ch) => ch.id === id)?.text ?? '?'
  const describe = (answer) => (cur ? cur.fields.map((f) => `${cur.fields.length > 1 ? `${f.label}: ` : ''}${text(f, answer?.picks?.[f.key])}`).join(' · ') : '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={`Peek at ${team.name}`}>
      <section className="paper my-auto w-full max-w-3xl rounded-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Label className="!text-fire">👀 Peeking at {team.name}</Label>
            {cur && <h2 className="mt-1 font-display text-2xl font-bold text-accent">{roundOf(cur.round).emoji} {roundOf(cur.round).title}: {cur.title}</h2>}
            {c?.finished && <h2 className="mt-1 font-display text-2xl font-bold text-accent">Every step done</h2>}
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-line px-3 py-1 font-bold hover:bg-hover" aria-label="Close">✕</button>
        </div>

        {error && <p className="mt-3 font-bold text-bad">{error}</p>}
        {!data && !error && <p className="mt-4 text-muted">Loading…</p>}

        {c && (
          <>
            <ol className="mt-3 flex flex-wrap gap-1.5">
              {data.history.map((h) => (
                <li key={h.step} title={h.title} className={`rounded-md px-2 py-1 text-xs font-bold ${h.solved ? (h.solved.revealed ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok') : h.step === c.step && !c.finished ? 'bg-accent-soft text-accent' : 'bg-panel text-muted'}`}>
                  {roundOf(h.round).emoji} {h.step + 1} {h.solved ? (h.solved.revealed ? 'shown' : '✓') : h.step === c.step && !c.finished ? 'now' : ''}{h.wrong ? ` · ${h.wrong}✗` : ''}
                </li>
              ))}
            </ol>

            {cur && (
              <>
                <div className="mt-4 rounded-lg bg-panel p-3 text-sm">
                  <Label>What their phones show</Label>
                  <p className="mt-1">{cur.prompt}</p>
                  {cur.fields.map((f) => (
                    <p key={f.key} className="mt-1 text-muted">{cur.fields.length > 1 ? <b className="text-ink">{f.label}: </b> : null}{f.choices.map((ch) => ch.text).join(' / ')}</p>
                  ))}
                </div>

                <p className="mt-3 text-sm">⚡ Lead: <b>{data.lead ?? '…'}</b> · {c.misses ? <span className="font-bold text-bad">{c.misses} wrong tr{c.misses === 1 ? 'y' : 'ies'} on this step</span> : 'no wrong tries on this step yet'}</p>

                <div className="mt-3">
                  <Label>Their tries on this step</Label>
                  {data.attempts.length === 0 ? <p className="mt-1 text-sm text-muted">Nothing submitted yet.</p> : (
                    <ol className="mt-1 space-y-1">
                      {data.attempts.map((a, i) => (
                        <li key={i} className={`flex items-start gap-2 rounded-md px-2 py-1 text-sm ${a.correct ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`}>
                          <span>{a.correct ? '✓' : '✗'}</span>
                          <span className="min-w-0"><b>{a.by}:</b> {describe(a.answer)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="!px-3 !py-1.5 text-sm" onClick={() => setShownFor(showAnswer ? null : step)}>{showAnswer ? 'Hide' : 'Show'} the answer</Button>
                  <span className="text-xs text-muted">(hidden by default in case this is on the projector)</span>
                </div>
                {showAnswer && <p className="mt-2 rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">{data.answer}</p>}
                <ReportProblem call={call} location={`${team.name} · ${roundOf(cur.round).title}: ${cur.title}`} question={cur.prompt} answer={data.answer ?? ''} className="mt-3 block" />
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}
