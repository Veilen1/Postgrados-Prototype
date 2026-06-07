export function attendancePercentage(seminar) {
  if (!seminar || !seminar.sessions) return 0
  const present = (seminar.attendanceRecords || []).filter(Boolean).length
  return Math.round((present / seminar.sessions) * 100)
}

export function overallAttendancePercent(aspirante) {
  if (!aspirante || !aspirante.academicProfile) return 0
  const seminars = aspirante.academicProfile.seminars || []
  if (seminars.length === 0) return 0
  const vals = seminars.map(s => attendancePercentage(s))
  const sum = vals.reduce((a, b) => a + b, 0)
  return Math.round(sum / vals.length)
}

export function progressPercent(aspirante) {
  // Composite progress: documents (40%), attendance (40%), approvals (20%)
  if (!aspirante) return 0

  // Documents percent (based on required keys used in demo)
  const required = ['dni', 'formulario', 'partidaNacimiento', 'cuil', 'titulo']
  // Only verified documents count toward completion
  const verifiedKeys = (aspirante.files || []).filter(f => f.verified).map(f => f.key)
  const docsPct = required.length === 0 ? 100 : Math.round((required.filter(r => verifiedKeys.includes(r)).length / required.length) * 100)

  // Attendance percent
  const attendPct = overallAttendancePercent(aspirante)

  // Approvals percent (seminars approved)
  const seminars = (aspirante.academicProfile && aspirante.academicProfile.seminars) || []
  const approvalsPct = seminars.length === 0 ? 100 : Math.round((seminars.filter(s => !!s.approved).length / seminars.length) * 100)

  const total = Math.round(docsPct * 0.4 + attendPct * 0.4 + approvalsPct * 0.2)
  return total
}

export function semaforoColor(percent) {
  if (percent >= 80) return 'green'
  if (percent >= 50) return 'orange'
  return 'red'
}
