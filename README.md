# Spike

A PLTL anatomy & physiology game: fire a neuron, one decision at a time. A&P leaders say the nervous system, and the
action potential especially, is where students struggle most. Each team gets its own run through the rounds the leader
picks (choices shuffled, numbers and the synapse example generated per team):

1. **Fire it:** threshold, Na⁺ channels open and Na⁺ rushes in, Na⁺ channels close and K⁺ channels open, K⁺ out
   (repolarization), the overshoot (hyperpolarization), and the Na⁺/K⁺ pump (3 out, 2 in, ATP).
2. **Big enough?** single and summed stimuli vs threshold, and all-or-none.
3. **Too soon?** absolute vs relative refractory periods, and why the signal only goes one way.
4. **Myelin race:** saltatory conduction, nodes of Ranvier, oligodendrocytes vs Schwann cells, MS.
5. **Across the synapse:** the neuromuscular junction (acetylcholine) or a dopamine synapse, step by step; how the
   signal stops (acetylcholinesterase or reuptake); and a drug or toxin twist.

Every right pick draws the next stretch of the team's voltage trace on its phones and the projector (or the next link
of the synapse chain). One student per team is the **lead** and locks in each pick; the role rotates every step. Each
step is worth 50 points, minus a quarter per wrong try; after two, the team can see the answer and move on (0 points).
Solved steps build up as study notes with the reason for each answer. Optional clock (20, 30 or 45 minutes).

## Pages

| Path | Who | What |
|---|---|---|
| `/` | Leader | Lobby (teams, rounds, clock), then the projector (every team's scope) and results |
| `/join` | Students | Join with the code, follow the trace, make the pick when you're the lead |

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the shared PLTL Supabase project's URL and publishable key.
3. `npm run dev`

The backend (tables `spk_*`, functions `spk-game` and `spk-play`, rules in `_shared/spike.ts`) lives in the
`supabase-backend` repository.
