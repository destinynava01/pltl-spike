import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import HowToPlay from './HowToPlay'
import { SLIDES as HOW_TO_SLIDES } from './howToSlides'
import { spkGame, watchGame } from './api'
import { DURATIONS, HUB_URL, MAX_TEAMS, MIN_TEAMS, ROUNDS, SITE_NAME, TEAM_COLORS } from './config'
import { saveSession } from './session'
import { Button, Label, Paper } from './ui'

const choice = (on) =>
  `rounded-lg border px-3 py-2 text-center font-display text-base transition ${on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel hover:bg-hover'}`

// Leader lobby: create the game -> teams -> finalize -> rounds and clock -> start. Every team gets its own run.
// Students join from their phones; the leader puts them on teams. A team of one works.
export default function Lobby({ onStart, onOpenBoard, hasGame, resume, onCloseGame }) {
  const [session, setSession] = useState(resume?.session ?? null)
  const [teamNames, setTeamNames] = useState(resume?.teams?.length ? resume.teams : ['Team 1', 'Team 2'])
  const [finalized, setFinalized] = useState(Boolean(resume?.finalized))
  const [rounds, setRounds] = useState(() => ROUNDS.filter((r) => !r.optional).map((r) => r.id))
  const [duration, setDuration] = useState(null)
  const [players, setPlayers] = useState([])
  const [busy, setBusy] = useState(false)
  const [guide, setGuide] = useState(false) // the how-to guide, shown when Start is pressed (before any clock starts)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return undefined
    const load = () => spkGame({ action: 'list_players', game_id: session.gameId, host_token: session.hostToken }).then((d) => setPlayers(d.players)).catch(() => {})
    load()
    return watchGame(session.gameId, ['lobby'], load, 10000)
  }, [session])

  const call = (payload) => spkGame({ ...payload, game_id: session.gameId, host_token: session.hostToken })
  const run = async (fn) => {
    setBusy(true)
    setError('')
    try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const teamLabel = (i) => teamNames[i].trim() || `Team ${i + 1}`
  const waiting = players.filter((p) => p.approval_status === 'pending')
  const sizes = teamNames.map((_, i) => players.filter((p) => p.approval_status === 'approved' && p.team_index === i).length)
  const emptyTeams = teamNames.map((_, i) => i).filter((i) => sizes[i] === 0)
  const stepCount = ROUNDS.filter((r) => rounds.includes(r.id)).reduce((n, r) => n + r.steps, 0)
  const toggleRound = (id) => setRounds(rounds.includes(id) ? rounds.filter((x) => x !== id) : [...rounds, id])

  const create = () => run(async () => {
    const d = await spkGame({ action: 'create_game' })
    const s = { gameId: d.game.id, hostToken: d.host_token, joinCode: d.game.join_code }
    saveSession(s)
    setSession(s)
  })
  const finalize = () => run(async () => { await call({ action: 'set_teams', team_names: teamNames.map((_, i) => teamLabel(i)) }); setFinalized(true) })
  const studentAction = (payload) => run(async () => { await call(payload); setPlayers((await call({ action: 'list_players' })).players) })
  const start = () => run(async () => {
    await call({ action: 'start_game', team_names: teamNames.map((_, i) => teamLabel(i)), duration_min: duration, rounds })
    onStart(session)
  })

  const joinUrl = session ? `${window.location.origin}/join?code=${session.joinCode}` : ''

  return (
    <main className="lab-bg min-h-dvh p-4 text-ink sm:p-8">
      {/* Start shows the how-to guide first; the game (and its clock) starts when it closes */}
      {guide && <HowToPlay site="spike" gameId="lobby" name={SITE_NAME} accent="#22d3ee" slides={HOW_TO_SLIDES} open onClose={() => { setGuide(false); start() }} />}
      {hasGame && <button onClick={onOpenBoard} className="fixed right-4 top-4 z-20 rounded-lg border border-line bg-card px-4 py-2 font-display hover:bg-hover">Back to the game</button>}

      <header className="mx-auto mb-10 max-w-5xl text-center">
        <p className="tag text-sm">{SITE_NAME}</p>
        <h1 className="mt-3 font-display text-5xl font-bold">Lab Bench</h1>
        <p className="mt-2 text-muted">Set up the teams, pick the rounds, then let the neurons fire.</p>
        <p className="mt-2 text-sm font-bold"><a href={HUB_URL} className="text-accent hover:underline">← All games</a></p>
        <div className="mt-6">
          {session ? (
            <div className="flex flex-col items-center gap-3">
              <p className="font-display text-xl text-spike">Game ready!</p>
              <Button variant="outline" className="!px-4 !py-2 text-sm" disabled={busy} onClick={() => window.confirm('Close this game? Every student will be sent back to the join page.') && onCloseGame()}>Close game and start fresh</Button>
            </div>
          ) : <Button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create new game'}</Button>}
          {error && <p className="mt-3 rounded-lg bg-bad-soft px-3 py-2 font-bold text-bad">{error}</p>}
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        <Paper>
          <h2 className="font-display text-2xl font-bold text-accent">Join</h2>
          <p className="mt-3">Join code: {session ? <span className="font-display text-3xl font-bold tracking-widest text-spike">{session.joinCode}</span> : <span className="text-muted">Not created yet</span>}</p>
          {session && (
            <div className="mt-5 flex flex-col items-center">
              <div className="rounded-lg bg-white p-4 shadow"><QRCodeSVG value={joinUrl} size={200} title={`Join code ${session.joinCode}`} /></div>
              <p className="mt-3 text-center text-sm text-muted">Students scan this with their phone camera to join.</p>
            </div>
          )}
          <div className="mt-6 rounded-lg border border-dashed border-line p-4 text-sm">
            <p className="font-display text-base font-semibold">How it plays</p>
            <p className="mt-2 text-muted">
              Every decision is a pick on the phone: which channels open, which way the ions move, what the voltage does.
              A right pick draws the next stretch of the team&apos;s trace. One <b className="text-ink">lead</b> makes each pick; the role rotates every step.
              Every team gets its own order and numbers, so no copying.
            </p>
          </div>
        </Paper>

        <Paper>
          <h2 className="font-display text-2xl font-bold text-accent">Teams</h2>
          <div className="mt-4 space-y-2">
            {teamNames.map((name, i) => (
              <div key={i} className="flex items-center gap-3 overflow-hidden rounded-lg border border-line bg-panel">
                <span className="w-2 self-stretch" style={{ background: TEAM_COLORS[i] }} aria-hidden="true" />
                <input className="min-w-0 flex-1 bg-transparent py-2.5 font-display text-lg outline-none" value={name} maxLength={40} disabled={finalized}
                  aria-label={`Name for team ${i + 1}`} onChange={(e) => setTeamNames(teamNames.map((n, k) => (k === i ? e.target.value : n)))} />
                {finalized && <span className="pr-3 text-sm text-muted">{sizes[i]} student{sizes[i] === 1 ? '' : 's'}</span>}
                {!finalized && teamNames.length > MIN_TEAMS && (
                  <button type="button" onClick={() => setTeamNames(teamNames.filter((_, k) => k !== i))} aria-label={`Remove team ${i + 1}`} className="mr-3 px-2 text-muted hover:text-bad">✕</button>
                )}
              </div>
            ))}
          </div>
          {!finalized && teamNames.length < MAX_TEAMS && <Button variant="outline" className="mt-3 w-full" onClick={() => setTeamNames([...teamNames, `Team ${teamNames.length + 1}`])}>+ Add team ({teamNames.length}/{MAX_TEAMS})</Button>}
          <p className="mt-2 text-xs text-muted">Teams of 2 to 5 work best. Every team needs at least one student.</p>
          <Button className="mt-4 w-full" disabled={!session || finalized || busy} onClick={finalize}>{finalized ? 'Teams finalized' : 'Finalize teams'}</Button>
          {finalized && <button type="button" className="mt-2 text-sm font-bold text-accent" onClick={() => setFinalized(false)}>Edit teams</button>}

          {finalized && (
            <div className="mt-6 space-y-5 border-t border-dashed border-line pt-4">
              <div>
                <Label>Rounds</Label>
                <ul className="mt-2 space-y-1.5">
                  {ROUNDS.map((r) => {
                    const on = rounds.includes(r.id)
                    return (
                      <li key={r.id}>
                        <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm ${on ? 'border-accent bg-accent-soft' : 'border-line bg-panel hover:bg-hover'}`}>
                          <input type="checkbox" checked={on} onChange={() => toggleRound(r.id)} className="mt-1 h-4 w-4 accent-cyan-400" />
                          <span className="flex-1"><b>{r.emoji} {r.title}</b>{r.optional && <span className="ml-1 text-xs text-muted">(optional)</span>}<span className="block text-muted">{r.what}</span></span>
                          <span className="text-xs text-muted">{r.steps} steps</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-1 text-xs text-muted">Skip any round your section hasn&apos;t covered yet. {stepCount} steps in all.</p>
              </div>
              <div>
                <Label>Clock</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {DURATIONS.map((d) => <button key={String(d)} type="button" className={choice(duration === d)} onClick={() => setDuration(d)}>{d ? `${d} min` : 'None'}</button>)}
                </div>
                <p className="mt-1 text-xs text-muted">With no clock, the game ends when every team finishes (or you end it).</p>
              </div>
              {emptyTeams.length > 0 && <p className="text-sm font-bold text-bad">Every team needs at least one student. Still empty: {emptyTeams.map(teamLabel).join(', ')}.</p>}
              <Button variant="fire" className="w-full" disabled={busy || emptyTeams.length > 0 || rounds.length === 0} onClick={() => (!howToSkipped() ? setGuide(true) : start())}>
                {busy ? 'Starting…' : rounds.length === 0 ? 'Pick at least one round' : '⚡ Start'}
              </Button>
            </div>
          )}
        </Paper>

        <Paper className="md:col-span-2" pinned={false}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-accent">Students waiting</h2>
            <Button variant="outline" className="!px-4 !py-2 text-sm" disabled={!finalized || waiting.length === 0 || busy} onClick={() => studentAction({ action: 'assign_random' })}>🎲 Randomly assign teams ({waiting.length})</Button>
          </div>
          {!session && <p className="mt-4 text-muted">Create the game first, then students can join with the code.</p>}
          {session && !finalized && <p className="mt-4 text-muted">Finalize the teams so you can put students on them.</p>}
          {session && players.length === 0 && <p className="mt-4 text-muted">No students have joined yet.</p>}
          {waiting.length > 0 && (
            <ul className="mt-4 space-y-2">
              {waiting.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-panel px-3 py-2">
                  <span className="font-bold">{p.display_name}</span>
                  <span className="flex flex-wrap gap-2">
                    {teamNames.map((_, i) => (
                      <button key={i} type="button" disabled={!finalized || busy} onClick={() => studentAction({ action: 'approve_player', player_id: p.id, team_index: i })}
                        className="rounded-md px-3 py-1 text-sm font-bold text-on-accent disabled:opacity-40" style={{ background: TEAM_COLORS[i] }}>{teamLabel(i)}</button>
                    ))}
                    <button type="button" disabled={busy} onClick={() => studentAction({ action: 'remove_player', player_id: p.id })} className="rounded-md border border-line px-3 py-1 text-sm font-bold hover:bg-hover">Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {players.some((p) => p.approval_status === 'approved') && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {teamNames.map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-line bg-panel">
                  <div className="h-1.5" style={{ background: TEAM_COLORS[i] }} />
                  <div className="p-3">
                    <p className="font-display font-semibold">{teamLabel(i)}</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {players.filter((p) => p.approval_status === 'approved' && p.team_index === i).map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2">
                          <span>{p.display_name}</span>
                          <button type="button" aria-label={`Remove ${p.display_name}`} disabled={busy} onClick={() => studentAction({ action: 'remove_player', player_id: p.id })} className="text-xs font-bold text-bad">✕</button>
                        </li>
                      ))}
                      {sizes[i] === 0 && <li className="text-xs font-bold text-bad">Needs a student</li>}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Paper>
      </section>
    </main>
  )
}

// The leader turned the how-to guide off on this computer ("Don't show this again")
function howToSkipped() {
  try {
    return Boolean(localStorage.getItem('pltlHowToSkip:spike'))
  } catch {
    return false
  }
}
