import { useCallback, useEffect, useRef, useState } from 'react'
import { spkPlay, watchGame } from './api'
import Scope, { Chain } from './Scope'
import { clockText, roundOf, SITE_NAME } from './config'
import { playClosed, playSolved, playWrong } from './sounds'
import { Button, CenterCard, Label, Paper, Stamp } from './ui'

const STORAGE_KEY = 'spikeStudent'
const DEVICE_KEY = 'spikeDevice'
const field = 'w-full rounded-lg border border-line bg-panel px-4 py-3 text-center text-xl font-bold text-ink outline-none focus:border-accent'

function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id) }
    return id
  } catch {
    return crypto.randomUUID()
  }
}
const readSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null } }
const writeSaved = (v) => { try { v ? localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) : localStorage.removeItem(STORAGE_KEY) } catch { /* blocked */ } }

// The phone: join, wait for a team, then work through the run. Everyone sees the trace and the choices; the lead
// (it rotates every step) makes the pick.
export default function StudentJoin() {
  const [saved, setSaved] = useState(readSaved)
  const [notice, setNotice] = useState('')
  const leave = useCallback((message = '') => { writeSaved(null); setSaved(null); setNotice(message) }, [])
  return saved ? <Room saved={saved} onLeave={leave} /> : <JoinForm notice={notice} onJoined={(v) => { writeSaved(v); setSaved(v); setNotice('') }} />
}

function JoinForm({ onJoined, notice }) {
  const [code, setCode] = useState(() => (new URLSearchParams(window.location.search).get('code') ?? '').toUpperCase())
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function join(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const d = await spkPlay({ action: 'join', join_code: code, display_name: name, device_id: deviceId() })
      onJoined({ playerId: d.player.id, gameId: d.game.id })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <CenterCard title={SITE_NAME}>
      <p className="mt-2 text-muted">Ready to fire some neurons?</p>
      <form onSubmit={join} className="mt-4 space-y-4">
        {notice && <p className="font-bold text-muted">{notice}</p>}
        <div>
          <Label>Game code</Label>
          <input className={`${field} mt-2 uppercase tracking-[0.4em]`} maxLength={6} placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required autoCapitalize="characters" autoComplete="off" />
        </div>
        <div>
          <Label>Your name</Label>
          <input className={`${field} mt-2`} maxLength={40} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <Button className="w-full" disabled={busy || code.length < 6 || !name.trim()}>{busy ? 'Joining…' : 'Join'}</Button>
        {error && <p className="font-bold text-bad">{error}</p>}
      </form>
    </CenterCard>
  )
}

function Room({ saved, onLeave }) {
  const [view, setView] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null) // { kind: 'right' | 'wrong' | 'closed' | 'info', text, at }
  const [now, setNow] = useState(() => Date.now())
  const lastEvent = useRef(null)
  const ownPlay = useRef(false)
  const stamp = useRef(0)
  const say = (kind, text) => { stamp.current += 1; setFlash({ kind, text, at: stamp.current }) }

  const check = useCallback(() => spkPlay({ action: 'status', player_id: saved.playerId, device_id: deviceId() })
    .then((d) => {
      if (d.ended) return onLeave('That game has ended. Join another with a new code.')
      // A teammate (the lead) picked: sounds for everyone, a note when it wasn't this phone
      const e = d.last_event
      if (e && lastEvent.current && e.at !== lastEvent.current) {
        if (e.kind === 'closed') playClosed()
        else if (e.kind === 'wrong') playWrong()
        else playSolved()
        if (!ownPlay.current && !e.mine) {
          if (e.kind === 'wrong') say('wrong', `🔍 ${e.by}'s pick didn't work. Look again together.`)
          else if (e.kind === 'closed') say('closed', '🎉 Every step done!')
          else say('right', `✅ ${e.by} got it. On to the next step!`)
        }
      }
      ownPlay.current = false
      lastEvent.current = e?.at ?? lastEvent.current ?? 'none'
      setView({ ...d, offset: Date.parse(d.server_now) - Date.now() })
      setError('')
    })
    .catch((err) => {
      if (/not found|another phone/i.test(err.message)) return onLeave('You were removed from that game.')
      setError(err.message)
    }), [saved, onLeave])

  useEffect(() => {
    check()
    return watchGame(saved.gameId, ['state', 'lobby'], check, 5000)
  }, [saved, check])
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])

  async function send(action, answer) {
    setBusy(true)
    setError('')
    try {
      ownPlay.current = true
      const r = await spkPlay({ action, player_id: saved.playerId, device_id: deviceId(), step: view.case.step, answer })
      if (r.closed) say('closed', `🎉 ${r.feedback} Every step done${r.rank ? ` (#${r.rank} to finish)` : ''}!`)
      else if (r.revealed) say('info', `📂 ${r.feedback}`)
      else if (r.correct) say('right', `✅ ${r.feedback} +${r.points}`)
      else say('wrong', `❌ ${r.feedback}${r.can_reveal ? ' (You can ask to see the answer now.)' : ''}`)
      await check()
    } catch (e) {
      ownPlay.current = false
      setError(e.message)
      check()
    } finally {
      setBusy(false)
    }
  }

  if (!view) return <CenterCard title={SITE_NAME}><p className="mt-4 text-muted">{error || 'Connecting…'}</p></CenterCard>
  const { player, teams } = view
  const myTeam = teams[player.team_index]
  const c = view.case
  const left = view.game.ends_at ? Date.parse(view.game.ends_at) - (now + view.offset) : null
  let body

  if (player.approval_status !== 'approved') body = <Note title="Almost in!" text="Your leader will put you on a team in a moment." />
  else if (view.game.status === 'setup') body = <Note title={`You're on ${myTeam?.name ?? 'a team'}`} text="The game starts soon. Watch the projector." />
  else if (!c) body = <Note title="Warming up the scope…" text="" />
  else if (view.game.status === 'finished' || c.finished) {
    body = (
      <>
        <Paper className="text-center">
          {c.finished ? <Stamp className="text-3xl">All done</Stamp> : <p className="font-display text-2xl">Time&apos;s up!</p>}
          <p className="mt-4 font-display text-xl">{myTeam?.name}: {c.points} points</p>
          <p className="mt-1 text-muted">{c.solved.length} of {c.steps} steps{c.finish_rank ? ` · #${c.finish_rank} to finish` : ''}</p>
        </Paper>
        <Notes c={c} />
      </>
    )
  } else {
    body = (
      <>
        <RoundProgress f={c.file} />
        <Display f={c.file} color={myTeam?.color} />
        <Task key={c.step} c={c} lead={view.lead} busy={busy} canReveal={view.can_reveal} onAnswer={(a) => send('answer', a)} onReveal={() => send('reveal')} />
        <Notes c={c} />
      </>
    )
  }

  return (
    <main className="lab-bg min-h-dvh text-ink">
      <div className="mx-auto max-w-md space-y-4 p-4">
        <header className="flex items-center justify-between gap-2 rounded-xl border border-line bg-card/90 px-3 py-2 shadow">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{player.display_name}</p>
            {myTeam && <p className="text-sm text-muted"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: myTeam.color }} />{myTeam.name}</p>}
          </div>
          <div className="text-right">
            {left !== null && view.game.status === 'playing' && <p className={`font-display text-xl ${left < 120000 ? 'text-fire' : ''}`}>⏱ {clockText(left)}</p>}
            {c && <p className="font-display text-sm text-spike">{c.points} pts</p>}
          </div>
        </header>
        {flash && (
          <p key={flash.at} className={`pop rounded-xl px-4 py-3 font-semibold shadow ${flash.kind === 'wrong' ? 'shake bg-bad-soft text-bad' : flash.kind === 'info' ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok'}`}>{flash.text}</p>
        )}
        {body}
        {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-center font-bold text-bad">{error}</p>}
        <p className="text-center"><button onClick={() => onLeave()} className="text-sm text-muted hover:text-ink">Leave game</button></p>
      </div>
    </main>
  )
}

function RoundProgress({ f }) {
  return (
    <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${f.rounds.length}, minmax(0, 1fr))` }}>
      {f.rounds.map((r) => {
        const meta = roundOf(r.id)
        const done = r.done === r.steps
        const now = f.round === r.id
        return (
          <li key={r.id} className={`rounded-lg px-1 py-1.5 text-center text-xs font-bold shadow ${done ? 'bg-ok-soft text-ok' : now ? 'bg-accent-soft text-accent' : 'bg-card/70 text-muted'}`}>
            <span className="block text-lg">{done ? '✓' : meta.emoji}</span>{r.done}/{r.steps}
          </li>
        )
      })}
    </ol>
  )
}

// The scope (or the synapse chain) for the current round
function Display({ f, color }) {
  if (!f.chain && !f.trace) return null
  return (
    <Paper pinned={false} className="!p-3">
      {f.chain ? <Chain links={f.chain} example={f.example} /> : <Scope trace={f.trace} color={color} />}
    </Paper>
  )
}

// The current step: the question, a row of choices per part, and (for the lead) the submit button
function Task({ c, lead, busy, canReveal, onAnswer, onReveal }) {
  const cur = c.file.current
  const [picks, setPicks] = useState({})
  const isLead = lead?.me
  const ready = cur.fields.every((f) => picks[f.key])
  const round = roundOf(cur.round)
  return (
    <Paper key={c.step}>
      <Label>{round.emoji} {round.title} · step {c.step + 1} of {c.steps}</Label>
      <h2 className="mt-1 font-display text-2xl font-bold text-accent">{cur.title}</h2>
      <p className="mt-2">{cur.prompt}</p>
      <div className="mt-3 space-y-3">
        {cur.fields.map((f) => (
          <fieldset key={f.key}>
            {cur.fields.length > 1 && <legend className="mb-1 text-sm font-bold text-muted">{f.label}</legend>}
            <div className="grid gap-1.5">
              {f.choices.map((ch) => (
                <button key={ch.id} type="button" disabled={!isLead || busy} onClick={() => setPicks({ ...picks, [f.key]: ch.id })}
                  className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${picks[f.key] === ch.id ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel'} ${isLead ? 'hover:bg-hover' : 'cursor-default'}`}>
                  {ch.text}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {isLead && <Button className="mt-4 w-full" disabled={busy || !ready} onClick={() => onAnswer({ picks })}>{busy ? 'Checking…' : '⚡ Lock it in'}</Button>}
      <div className="mt-4 rounded-lg bg-panel px-3 py-2 text-sm">
        {isLead
          ? <p className="font-bold text-accent">⚡ You&apos;re the lead for this step. Talk it through with your team, then make the pick.</p>
          : <p>⚡ <b>{lead?.name ?? 'Your teammate'}</b> is the lead for this step. Help out loud!</p>}
        {c.misses > 0 && <p className="mt-1 text-bad">{c.misses} wrong tr{c.misses === 1 ? 'y' : 'ies'} on this step (each costs a quarter of its points).</p>}
      </div>
      {isLead && canReveal && (
        <button type="button" disabled={busy} onClick={() => window.confirm('Show the answer? This step scores 0, but your team moves on.') && onReveal()} className="mt-3 w-full text-sm font-bold text-warn underline">
          Stuck? Show us the answer (0 points for this step)
        </button>
      )}
    </Paper>
  )
}

// Every solved step: the answer and why (a study sheet that builds up as the team plays)
function Notes({ c }) {
  const notes = c.file.notes
  if (!notes.length) return null
  return (
    <Paper pinned={false}>
      <Label>Your notes</Label>
      <ol className="mt-2 space-y-2 text-sm">
        {[...notes].reverse().map((n) => (
          <li key={n.step} className="rounded-lg bg-panel px-3 py-2">
            <p className="font-bold">{roundOf(n.round).emoji} {n.title}: <span className="text-accent">{n.answer}</span></p>
            <p className="mt-0.5 text-muted">{n.explain}</p>
          </li>
        ))}
      </ol>
    </Paper>
  )
}

function Note({ title, text }) {
  return (
    <Paper className="text-center">
      <h2 className="font-display text-2xl font-bold text-accent">{title}</h2>
      {text && <p className="mt-2 text-muted">{text}</p>}
    </Paper>
  )
}
