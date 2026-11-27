/* eslint-disable react-refresh/only-export-components -- static slide content with small local helpers */
// The "How to play" slides for Spike (shown before the game starts). The art uses the same pieces as the real game
// (instrument panels, the scope, the pick buttons).
import Scope from './Scope'

function Panel({ children, className = '' }) {
  return <div className={`paper w-full max-w-sm rounded-xl p-4 text-left text-sm text-ink ${className}`}>{children}</div>
}
function Pick({ children, on }) {
  return <p className={`mt-1 rounded-lg border px-3 py-1.5 font-semibold ${on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel'}`}>{children}</p>
}
const FULL = [[0, -70], [1, -70], [2, -55], [2.4, -20], [3, 30], [3.3, 24], [4.2, -15], [5, -70], [5.6, -80], [6.5, -76], [8, -70], [10, -70]]

export const SLIDES = [
  {
    title: 'Fire a neuron',
    text: 'Every team gets a neuron and its own run through the rounds. Each step is a decision: which channels open, which way the ions move, what the voltage does. Get it right and the next stretch of your trace appears.',
    art: (
      <Panel>
        <Scope trace={FULL} height={150} />
      </Panel>
    ),
  },
  {
    title: 'One lead at a time',
    text: 'Everyone\'s phone shows the question and the choices, but one student is the lead and locks in the pick. The role moves to the next teammate after every step, so talk it through together first.',
    art: (
      <Panel>
        <p className="font-display text-lg font-bold text-accent">Fire!</p>
        <p className="mt-1 text-muted">Threshold! Which channels open, and which way do the ions move?</p>
        <Pick on>Na⁺ channels</Pick>
        <Pick>K⁺ channels</Pick>
        <Pick on>Into the cell</Pick>
      </Panel>
    ),
  },
  {
    title: 'The rounds',
    text: 'Fire it (the action potential, step by step), Big enough? (threshold and all-or-none), Too soon? (refractory periods), Myelin race, and Across the synapse (the neuromuscular junction or a dopamine synapse, how the signal stops, and a toxin twist).',
    art: (
      <Panel>
        <ol className="space-y-1">
          <li>⚡ <b>Fire it</b></li>
          <li>📏 <b>Big enough?</b></li>
          <li>⏱ <b>Too soon?</b></li>
          <li>🏁 <b>Myelin race</b></li>
          <li>🔗 <b>Across the synapse</b></li>
        </ol>
      </Panel>
    ),
  },
  {
    title: 'Points',
    text: 'Each step is worth 50 points; every wrong try costs a quarter. Stuck after two tries? You can see the answer and move on, for 0 points. Every answer goes into your team\'s notes with the reason, so the phone ends up as a study sheet. Finish first for a bonus!',
    art: (
      <Panel>
        <p className="flex justify-between font-display text-lg"><span>🥇 Team 2</span><span className="text-spike">920</span></p>
        <p className="mt-1 flex justify-between font-display text-lg"><span>🥈 Team 1</span><span className="text-spike">845</span></p>
        <p className="mt-3 text-center"><span className="stamp text-xl">Fired</span></p>
      </Panel>
    ),
  },
]

// The guide's own look: a dark instrument panel with a glowing cyan edge
export const SKIN = {
  backdrop: 'bg-[#04070e]/85',
  panel: 'rounded-xl border border-line bg-card text-ink shadow-2xl',
  glow: true,
  label: 'font-display text-sm font-semibold uppercase tracking-[0.25em]',
  skip: 'rounded-lg border border-line bg-panel px-3 py-1 text-sm font-bold text-muted hover:bg-hover',
  art: 'lab-bg rounded-xl',
  step: 'font-display text-sm uppercase tracking-widest text-muted',
  title: 'font-display text-3xl font-bold leading-tight text-accent sm:text-4xl',
  text: 'text-lg leading-relaxed text-ink',
  footer: 'border-t border-line bg-panel',
  check: 'text-sm text-muted',
  back: 'rounded-lg border border-line bg-card px-4 py-2 font-display text-ink hover:bg-hover',
  next: 'rounded-lg bg-accent px-5 py-2 font-display text-lg font-semibold text-on-accent hover:brightness-110',
  dotOff: '#2a3a5c',
  launcher: 'rounded-lg border border-line bg-card px-4 py-2 font-display text-sm text-accent shadow-lg hover:bg-hover',
}
