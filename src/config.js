// Change these to rebrand the game.
export const SITE_NAME = 'Spike'
export const SITE_TAGLINE = 'Fire a neuron, one decision at a time.'
export const HUB_URL = 'https://pltl-game-hub.vercel.app'

export const MIN_TEAMS = 1
export const MAX_TEAMS = 8
export const TEAM_COLORS = ['#22d3ee', '#f472b6', '#a3e635', '#fbbf24', '#a78bfa', '#fb923c', '#34d399', '#60a5fa']
export const DURATIONS = [null, 20, 30, 45] // minutes (null: no clock)

// The rounds, in play order (the same ids the server uses). Optional ones start switched off in the lobby.
export const ROUNDS = [
  { id: 'fire', title: 'Fire it', emoji: '⚡', what: 'Threshold, Na⁺ in, K⁺ out, the overshoot, and the Na⁺/K⁺ pump', steps: 6 },
  { id: 'threshold', title: 'Big enough?', emoji: '📏', what: 'Stimuli vs threshold, summation, all-or-none', steps: 3 },
  { id: 'refractory', title: 'Too soon?', emoji: '⏱', what: 'Absolute and relative refractory periods', steps: 4 },
  { id: 'myelin', title: 'Myelin race', emoji: '🏁', what: 'Saltatory conduction, nodes of Ranvier, who makes myelin', steps: 4, optional: true },
  { id: 'synapse', title: 'Across the synapse', emoji: '🔗', what: 'Ca²⁺, neurotransmitter release, receptors, how the signal stops', steps: 6 },
]
export const roundOf = (id) => ROUNDS.find((r) => r.id === id)

// mm:ss left on the clock
export function clockText(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Leader scenarios (the /scenarios and /review pages): this game's id, and the pages' background
export const SCENARIO_GAME = 'spike'
export const PAGE_BG = 'lab-bg'
