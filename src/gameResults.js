// The results as a spreadsheet: Teams, every Step of every team's run (with the answer and wrong tries), and
// Students. The Excel library loads only when someone downloads.
export async function downloadResults(report) {
  const XLSX = await import('xlsx')
  const book = XLSX.utils.book_new()
  const add = (name, rows, widths) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'Nothing to show.' }])
    sheet['!cols'] = widths.map((wch) => ({ wch }))
    XLSX.utils.book_append_sheet(book, sheet, name)
  }
  add('Teams', [...report.teams].sort((a, b) => b.points - a.points).map((t, i) => ({
    Place: i + 1, Team: t.name, Points: t.points, Steps: `${t.solved}/${t.total}`, Finished: t.finish_rank ? `#${t.finish_rank}` : 'No', Synapse: t.example ?? '',
  })), [6, 20, 8, 9, 9, 30])
  add('Steps', report.teams.flatMap((t) => t.steps.map((s) => ({
    Team: t.name, Round: s.round, Step: s.title, Result: s.status, Points: s.points, 'Wrong tries': s.wrong, Question: s.prompt, Answer: s.answer,
  }))), [16, 18, 26, 13, 7, 11, 60, 60])
  add('Students', report.students, [22, 16, 14, 7, 7])
  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(book, `Spike-results-${today}.xlsx`)
}
