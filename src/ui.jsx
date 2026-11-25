// Shared building blocks with the oscilloscope look: instrument panels on a gridded navy screen, glowing cyan
// buttons, and magenta "FIRED" badges

export function CenterCard({ title, children }) {
  return (
    <main className="lab-bg flex min-h-dvh items-center justify-center p-4 text-ink">
      <div className="paper pinned w-full max-w-md rounded-xl p-8 text-center">
        <h1 className="font-display text-4xl font-bold text-accent">{title}</h1>
        {children}
      </div>
    </main>
  )
}

export function Label({ children, className = '' }) {
  return <p className={`font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted ${className}`}>{children}</p>
}

const BUTTONS = {
  primary: 'bg-accent text-on-accent shadow-[0_0_18px_rgb(34_211_238/0.35)] hover:brightness-110',
  fire: 'bg-fire text-on-accent shadow-[0_0_18px_rgb(244_114_182/0.4)] hover:brightness-110',
  outline: 'border border-line bg-panel text-ink hover:bg-hover',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`rounded-lg px-6 py-3 font-display text-lg font-semibold tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${BUTTONS[variant]} ${className}`}
      {...props}
    />
  )
}

// An instrument panel
export function Paper({ children, className = '', pinned = true }) {
  return <section className={`paper rounded-xl p-5 ${pinned ? 'pinned' : ''} ${className}`}>{children}</section>
}

// The magenta badge ("FIRED", "DONE")
export function Stamp({ children, className = '' }) {
  return <span className={`stamp stamp-in ${className}`}>{children}</span>
}
