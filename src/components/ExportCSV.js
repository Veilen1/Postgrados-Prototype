// Simple CSV exporter
export function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) {
    const blob = new Blob([""], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    return
  }

  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => {
    const v = r[k] == null ? '' : r[k]
    // escape quotes
    const s = typeof v === 'string' ? v.replace(/"/g, '""') : String(v)
    return '"' + s + '"'
  }).join(','))).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}
