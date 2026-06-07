// Small localStorage-backed data provider with demo data
const LS_KEY = 'posgrado_demo_data'
const CURRENT_USER_KEY = 'posgrado_current_user'

function uid(prefix = 'id') {
  return prefix + '-' + Math.random().toString(36).slice(2, 9)
}

function computeLegajoStatus(asp) {
  // Legajo is considered 'completo' only if all required documents are present
  // AND each of them has been verified by conducción (file.verified === true).
  const required = ['dni', 'formulario', 'partidaNacimiento', 'cuil', 'titulo']
  const files = asp.files || []
  for (let i = 0; i < required.length; i++) {
    const key = required[i]
    const f = files.find(x => x.key === key)
    if (!f) return 'pendiente'
    if (!f.verified) return 'pendiente'
  }
  return 'completo'
}

// Return a detailed list of required documents and their status for an aspirante.
export function getMissingDocs(asp) {
  // asp can be either an aspirante object or an id
  let a = asp
  if (typeof asp === 'string') {
    const arr = getAspirantes()
    a = arr.find(x => x.id === asp)
  }
  if (!a) return []
  const required = [
    { key: 'dni', label: 'DNI' },
    { key: 'formulario', label: 'Formulario firmado' },
    { key: 'partidaNacimiento', label: 'Partida de nacimiento' },
    { key: 'cuil', label: 'CUIL/CUIT' },
    { key: 'titulo', label: 'Título de grado' }
  ]
  const files = a.files || []
  return required.map(r => {
    const f = files.find(x => x.key === r.key)
    return {
      key: r.key,
      label: r.label,
      present: !!f,
      file: f || null,
      verified: !!(f && f.verified),
      uploadedAt: f && f.uploadedAt ? f.uploadedAt : (f ? f.createdAt || null : null)
    }
  })
}

// Simple audit appender for demo actions (uploads, removals, verifications)
function appendAudit(entry) {
  const d = getData()
  d.audit = d.audit || []
  d.audit.push(entry)
  saveData(d)
}

export function getAuditForAspirante(aspiranteId) {
  const d = getData()
  const arr = d.audit || []
  const filtered = arr.filter(a => a.aspiranteId === aspiranteId)
  // sort desc
  return filtered.sort((x, y) => new Date(y.at) - new Date(x.at))
}

// Mark a specific document as verified by the reviewer (demo/localStorage).
export function verifyDocument(aspiranteId, key, reviewerName) {
  const arr = getAspirantes()
  const i = arr.findIndex(a => a.id === aspiranteId)
  if (i === -1) return false
  const files = arr[i].files || []
  const fi = files.findIndex(f => f.key === key)
  if (fi === -1) return false
  const now = new Date().toISOString()
  files[fi] = { ...files[fi], verified: true, verifiedBy: reviewerName || 'conduccion', verifiedAt: now }
  arr[i].files = files
  // Save using existing normalization
  saveAspirantes(arr)
  // audit
  try { appendAudit({ aspiranteId, action: 'verify', key, by: reviewerName || 'conduccion', at: now }) } catch (e) { /* ignore */ }
  return true
}

// Generate an invitation token for a cohort (demo). Returns the token string.
export function generateInvite(cohortId, daysValid = 30) {
  const d = getData()
  d.invitations = d.invitations || []
  const token = uid('inv')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + daysValid * 24 * 3600 * 1000).toISOString()
  d.invitations.push({ token, cohortId, createdAt: now.toISOString(), expiresAt })
  saveData(d)
  return token
}

export function getInvite(token) {
  if (!token) return null
  const d = getData()
  const arr = d.invitations || []
  const inv = arr.find(i => i.token === token)
  if (!inv) return null
  if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) return null
  return inv
}

function sampleAspirante(i, cohortId) {
  const names = [
    ['María','García'],['Juan','Pérez'],['Lucía','Rodríguez'],['Carlos','Sosa'],['Ana','López'],['Diego','Fernández']
  ]
  const pair = names[i % names.length]
  const files = []
  // Randomly add some files (simulate incomplete/completed legajos)
  if (i % 2 === 0) files.push({ key: 'dni', name: `dni_${i}.pdf` })
  if (i % 3 !== 0) files.push({ key: 'formulario', name: `form_${i}.pdf` })
  if (i % 4 === 0) files.push({ key: 'titulo', name: `titulo_${i}.pdf` })
  if (i % 5 !== 0) files.push({ key: 'cuil', name: `cuil_${i}.pdf` })
  if (i % 6 === 0) files.push({ key: 'partidaNacimiento', name: `partida_${i}.pdf` })

  // Academic profile with one seminar for demo
  const sessions = 10
  const presentCount = Math.max(0, Math.round((Math.random() * 0.6 + 0.4) * sessions))
  const attendanceRecords = Array.from({ length: sessions }).map((_, idx) => idx < presentCount)

  const finalGrade = Math.random() > 0.3 ? Math.round((6 + Math.random() * 4) * 10) / 10 : null
  const actaDate = finalGrade ? new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 3600 * 1000).toISOString() : null
  // deadline sometimes past, sometimes future
  const deadlineOffset = Math.floor(Math.random() * 120) - 30 // -30 .. +89 days
  const deadlineDate = new Date(Date.now() + deadlineOffset * 24 * 3600 * 1000).toISOString()

  // generate session dates (weekly) so teacher can register by date
  const sessionDates = Array.from({ length: sessions }).map((_, idx) => {
    return new Date(Date.now() - (sessions - 1 - idx) * 7 * 24 * 3600 * 1000).toISOString()
  })

  const career = i % 2 === 0 ? 'Especialización en Sistemas' : 'Maestría en Ingeniería'

  return {
    id: uid('a'),
    cohort: cohortId,
    apellido: pair[1],
    nombre: pair[0] + ' ' + i,
    nacionalidad: 'Argentina',
    dni: (30000000 + i).toString(),
    phoneMobile: `11-15${100000 + i}`,
    phoneHome: '',
    email: `user${i}@example.com`,
    altEmail: '',
    address: 'Calle Demo 123',
    city: 'La Plata',
    province: 'Buenos Aires',
    country: 'Argentina',
    degreeTitle: 'Ingeniería',
    career,
    howFound: 'sitio web',
    motivations: 'Me interesa profundizar en la temática.',
    files,
    scholarship: { type: null, file: null },
    legajoStatus: 'pendiente', // will be computed
    academicProfile: {
      cohort: cohortId,
      seminars: [
        {
          // deterministic seminar id per cohort so docentes can be assigned
          id: `sem-${cohortId}`,
          name: 'Seminario de Investigación',
          sessions,
          sessionDates,
          attendanceRecords,
          finalGrade,
          actaDate,
          deadline: deadlineDate,
          approved: false
        }
      ],
      tfi: Math.random() > 0.9 ? { status: 'aprobado', title: 'Trabajo Final Integrador', director: 'Dr. Demo', cprDate: new Date().toISOString(), resolution: 'Res-2024-001' } : { status: 'pendiente', title: null, director: null }
    },
    createdAt: new Date().toISOString()
  }
}

export function initDemoData() {
  if (localStorage.getItem(LS_KEY)) return

  // Sample programs (posgrados)
  const programs = [
    { id: 'p-especializacion', name: 'Especialización en Sistemas', description: 'Profundización en desarrollo y arquitecturas de software.' },
    { id: 'p-maestria', name: 'Maestría en Ingeniería', description: 'Formación avanzada en investigación y gestión tecnológica.' }
  ]

  const cohorts = [
    { id: 'es-2024', name: 'Cohorte 2024 - Especialización', open: true, programId: 'p-especializacion' },
    { id: 'es-2025', name: 'Cohorte 2025 - Especialización', open: true, programId: 'p-especializacion' },
    { id: 'm-2024', name: 'Cohorte 2024 - Maestría', open: true, programId: 'p-maestria' },
    { id: 'm-2025', name: 'Cohorte 2025 - Maestría', open: true, programId: 'p-maestria' }
  ]

  const users = [
    { id: 'u-admin', username: 'admin', password: 'admin', role: 'conduccion', name: 'Equipo Conducción' },
    { id: 'u-doc', username: 'docente', password: 'docente', role: 'docente', name: 'Profesor García' },
    { id: 'u-est1', username: 'est1', password: 'est1', role: 'estudiante', name: 'María Estud', studentId: null }
  ]

  const aspirantes = []
  for (let c = 0; c < cohorts.length; c++) {
    for (let i = 0; i < 6; i++) {
      const a = sampleAspirante(i + c * 6, cohorts[c].id)
      a.legajoStatus = computeLegajoStatus(a)
      // mark approved if finalGrade exists and >=6
      a.academicProfile.seminars.forEach(s => { s.approved = s.finalGrade !== null && s.finalGrade >= 6 })
      aspirantes.push(a)
    }
  }

  // Link the sample estudiante user to the first aspirante for demo "Mi Perfil" navigation
  const studentUser = users.find(u => u.role === 'estudiante')
  if (studentUser && aspirantes.length > 0) studentUser.studentId = aspirantes[0].id

  const data = { users, programs, cohorts, aspirantes }
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function getData() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed || {}
  } catch (e) {
    // corrupted data: reset
    console.warn('posgrado_demo_data corrupted, resetting', e)
    localStorage.removeItem(LS_KEY)
    return {}
  }
}

function saveData(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export function getUsers() {
  const d = getData()
  return d.users || []
}

export function getCohorts() {
  const d = getData()
  let raw = d.cohorts || d.cohortes
  if (!raw) return []

  // If raw is an object map, convert to array for return (don't persist/modify storage here)
  if (raw && !Array.isArray(raw) && typeof raw === 'object') {
    return Object.keys(raw).map(k => {
      const v = raw[k]
      if (v && typeof v === 'object') {
        // preserve other properties like programId
        return { ...v, id: v.id || k, name: v.name || `Cohorte ${k}`, open: ('open' in v) ? v.open : true }
      }
      return { id: k, name: `Cohorte ${k}`, open: true }
    })
  }

  // If raw is an array, normalize entries (do not save)
  if (Array.isArray(raw)) {
    return raw.map(item => {
      if (!item) return null
      if (typeof item === 'string') return { id: item, name: `Cohorte ${item}`, open: true }
      if (typeof item === 'object') return { ...item, id: item.id || item.name || String(item), name: item.name || `Cohorte ${item.id || item.name || ''}`, open: ('open' in item) ? item.open : true }
      return null
    }).filter(Boolean)
  }

  return []
}

export function getCohortById(id) {
  const cohorts = getCohorts()
  if (!cohorts) return undefined
  return cohorts.find(c => c && c.id === id)
}

export function toggleCohortOpen(cohortId) {
  try {
    // Ensure we work with a normalized cohorts array
    const cohorts = getCohorts() || []
    const idx = cohorts.findIndex(x => x && x.id === cohortId)
    if (idx === -1) return false
    const updated = [...cohorts]
    updated[idx] = { ...updated[idx], open: !updated[idx].open }
    const d = getData()
    d.cohorts = updated
    saveData(d)
    return updated[idx].open
  } catch (e) {
    console.error('toggleCohortOpen failed', e)
    return false
  }
}

/* Programs / Posgrados management */
export function getPrograms() {
  const d = getData()
  return d.programs || []
}

export function getProgramById(id) {
  const programs = getPrograms()
  return programs.find(p => p && p.id === id)
}

export function addProgram(obj) {
  const d = getData()
  const programs = d.programs || []
  const p = { id: uid('p'), name: obj.name || `Programa ${programs.length + 1}`, description: obj.description || '' }
  programs.push(p)
  d.programs = programs
  saveData(d)
  return p
}

export function updateProgram(id, updated) {
  const d = getData()
  const programs = d.programs || []
  d.programs = programs.map(p => p.id === id ? { ...p, ...updated } : p)
  saveData(d)
}

export function deleteProgram(id) {
  const d = getData()
  const programs = d.programs || []
  const remaining = programs.filter(p => p.id !== id)
  // remove cohorts and aspirantes linked to this program
  const cohorts = getCohorts().filter(c => c.programId !== id)
  const remainingCohortIds = cohorts.map(c => c.id)
  const aspirantes = (d.aspirantes || []).filter(a => remainingCohortIds.includes(a.cohort))

  d.programs = remaining
  d.cohorts = cohorts
  d.aspirantes = aspirantes
  saveData(d)
}

export function getCohortsByProgram(programId) {
  return getCohorts().filter(c => c.programId === programId)
}

export function addCohort(obj) {
  const d = getData()
  const cohorts = getCohorts()
  const c = { id: obj.id || uid('coh'), name: obj.name || `Cohorte ${cohorts.length + 1}`, open: ('open' in obj) ? !!obj.open : true, programId: obj.programId || null }
  const persisted = [...cohorts, c]
  d.cohorts = persisted
  saveData(d)
  return c
}

export function updateCohort(id, updated) {
  const d = getData()
  const cohorts = getCohorts()
  const changed = cohorts.map(c => c.id === id ? { ...c, ...updated } : c)
  d.cohorts = changed
  saveData(d)
}

export function deleteCohort(id) {
  const d = getData()
  const cohorts = getCohorts().filter(c => c.id !== id)
  d.cohorts = cohorts
  d.aspirantes = (d.aspirantes || []).filter(a => a.cohort !== id)
  saveData(d)
}

export function getAspirantesByCohort(cohortId) {
  return getAspirantes().filter(a => a.cohort === cohortId)
}

export function searchAspirantes(q) {
  const s = (q || '').toString().toLowerCase()
  if (!s) return getAspirantes()
  return getAspirantes().filter(a => (`${a.nombre} ${a.apellido}`.toLowerCase().includes(s) || (a.dni || '').includes(s) || (a.email || '').toLowerCase().includes(s)))
}

export function getAspirantes() {
  const d = getData()
  return d.aspirantes || []
}

export function saveAspirantes(arr) {
  const d = getData()
  // Ensure legajoStatus and approved flags are consistent before saving
  const normalized = (arr || []).map(a => {
    const copy = { ...a }
    if (copy.academicProfile && copy.academicProfile.seminars) {
      copy.academicProfile.seminars = copy.academicProfile.seminars.map(s => ({
        ...s,
        approved: s.finalGrade != null && Number(s.finalGrade) >= 6
      }))
    }
    copy.legajoStatus = computeLegajoStatus(copy)
    return copy
  })
  d.aspirantes = normalized
  saveData(d)
}

export function addTutoria(aspiranteId, note, author) {
  const arr = getAspirantes()
  const i = arr.findIndex(a => a.id === aspiranteId)
  if (i === -1) return false
  const now = new Date().toISOString()
  const tutoria = { id: uid('tut'), date: now, note, author }
  if (!arr[i].academicProfile) arr[i].academicProfile = { seminars: [], tfi: { status: 'pendiente' } }
  if (!arr[i].academicProfile.tutorias) arr[i].academicProfile.tutorias = []
  arr[i].academicProfile.tutorias.push(tutoria)
  saveAspirantes(arr)
  return tutoria
}

export function sendRemindersToDocentes() {
  const d = getData()
  if (!d.users) return 0
  const now = new Date().toISOString()
  let count = 0
  d.users.forEach(u => {
    if (u.role === 'docente') {
      u.lastReminderSent = now
      count++
    }
  })
  saveData(d)
  return count
}

export function addAspirante(obj) {
  const arr = getAspirantes()
  obj.id = uid('a')
  obj.createdAt = new Date().toISOString()
  obj.legajoStatus = computeLegajoStatus(obj)
  arr.push(obj)
  saveAspirantes(arr)
  return obj
}

export function updateAspirante(id, updated) {
  const arr = getAspirantes()
  const i = arr.findIndex(x => x.id === id)
  if (i === -1) return false
  arr[i] = { ...arr[i], ...updated }
  // recompute legajo if files changed
  arr[i].legajoStatus = computeLegajoStatus(arr[i])
  saveAspirantes(arr)
  return true
}

// Add a file object to an aspirante (demo/localStorage). If fileObj.key matches existing file, replace it.
export function addFileToAspirante(aspiranteId, fileObj) {
  const arr = getAspirantes()
  const i = arr.findIndex(a => a.id === aspiranteId)
  if (i === -1) return false
  const files = arr[i].files || []
  const idx = fileObj.key ? files.findIndex(f => f.key === fileObj.key) : -1
  if (idx >= 0) files[idx] = { ...files[idx], ...fileObj }
  else files.push({ ...fileObj })
  arr[i].files = files
  // save via normalization
  saveAspirantes(arr)
  try { appendAudit({ aspiranteId, action: 'add_file', key: fileObj.key, name: fileObj.name, by: fileObj.uploadedBy || 'system', at: fileObj.uploadedAt || new Date().toISOString() }) } catch (e) { }
  return true
}

// Remove a file from an aspirante by key or name
export function removeFileFromAspirante(aspiranteId, keyOrName) {
  const arr = getAspirantes()
  const i = arr.findIndex(a => a.id === aspiranteId)
  if (i === -1) return false
  const files = arr[i].files || []
  const filtered = files.filter(f => f.key !== keyOrName && f.name !== keyOrName)
  arr[i].files = filtered
  saveAspirantes(arr)
  try { appendAudit({ aspiranteId, action: 'remove_file', keyOrName, by: getCurrentUser() && getCurrentUser().name || 'system', at: new Date().toISOString() }) } catch (e) { }
  return true
}

export function deleteAspirante(id) {
  let arr = getAspirantes()
  arr = arr.filter(x => x.id !== id)
  saveAspirantes(arr)
}

export function login(username, password) {
  const users = getUsers()
  const u = users.find(x => x.username === username && x.password === password)
  if (!u) return null
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u))
  return u
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY)
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null')
}

export function updateUsers(users) {
  const d = getData()
  d.users = users
  saveData(d)
}
