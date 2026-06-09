import React, { useState, useEffect } from 'react'
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, TextField, Button, MenuItem, Box, Card, CardContent } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { getAspirantesByCohort, getCohorts, saveAspirantes, getAspirantes } from '../components/DataProvider'
import { useNotify } from '../components/NotificationProvider'
import ConfirmDialog from '../components/ConfirmDialog'

export default function TeacherSheet() {
  const cohorts = getCohorts()
  const [selectedCohort, setSelectedCohort] = useState(cohorts && cohorts.length > 0 ? cohorts[0].id : null)
  const [rows, setRows] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { notify } = useNotify()

  // Normalize aspirantes for the teacher sheet to avoid runtime errors when fields are missing
  function normalizeAspirante(a) {
    const copy = { ...a }
    if (!copy.academicProfile) copy.academicProfile = { seminars: [], tfi: { status: 'pendiente' } }
    if (!Array.isArray(copy.academicProfile.seminars)) copy.academicProfile.seminars = []
    if (copy.academicProfile.seminars.length === 0) {
      // create a default seminar record to allow marking attendance
      // provide a reasonable default of 10 weekly sessions so new aspirantes
      // have visible session dates and attendance checkboxes
      const sessions = 10
      const sessionDates = Array.from({ length: sessions }).map((_, idx) => new Date(Date.now() - (sessions - 1 - idx) * 7 * 24 * 3600 * 1000).toISOString())
      copy.academicProfile.seminars = [{ id: `sem-${copy.cohort || 'x'}`, name: 'Seminario (auto)', sessions, sessionDates, attendanceRecords: Array.from({ length: sessions }).map(() => false), finalGrade: null, approved: false }]
    } else {
      // ensure seminar has required arrays
      copy.academicProfile.seminars = copy.academicProfile.seminars.map(s => ({
        id: s.id || `sem-${copy.cohort || 'x'}`,
        name: s.name || 'Seminario',
        sessions: s.sessions || (s.sessionDates ? s.sessionDates.length : 0),
        sessionDates: s.sessionDates || Array.from({ length: s.sessions || 0 }).map(() => new Date().toISOString()),
        attendanceRecords: Array.isArray(s.attendanceRecords) ? s.attendanceRecords : Array.from({ length: s.sessions || (s.sessionDates ? s.sessionDates.length : 0) }).map(() => false),
        finalGrade: s.finalGrade ?? null,
        approved: !!s.approved,
        deadline: s.deadline || null
      }))
    }
    return copy
  }

  useEffect(() => {
    const list = selectedCohort ? getAspirantesByCohort(selectedCohort).map(normalizeAspirante) : []
    setRows(list)
  }, [selectedCohort])

  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  function togglePresent(rowIdx, semIdx) {
    const updated = [...rows]
    const r = updated[rowIdx]
    if (!r || !r.academicProfile || !r.academicProfile.seminars) return
    const s = r.academicProfile.seminars[0]
    if (!s) return
    // ensure attendanceRecords length
    const ar = Array.isArray(s.attendanceRecords) ? [...s.attendanceRecords] : []
    while (ar.length <= semIdx) ar.push(false)
    ar[semIdx] = !ar[semIdx]
    s.attendanceRecords = ar
    setRows(updated)
  }

  function updateGrade(rowIdx, value) {
    const updated = [...rows]
    const r = updated[rowIdx]
    if (!r || !r.academicProfile || !r.academicProfile.seminars) return
    r.academicProfile.seminars[0].finalGrade = value ? Number(value) : null
    setRows(updated)
  }

  function handleSaveAll() {
    // Persist back to global list
    const all = getAspirantes()
    const map = new Map(rows.map(r => [r.id, r]))
    const merged = all.map(a => map.has(a.id) ? map.get(a.id) : a)
    saveAspirantes(merged)
    notify('Guardado en demo (localStorage)', 'success')
  }

  function handleSaveConfirm() {
    setConfirmOpen(true)
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Planilla de docente (demo)</Typography>
      <Box sx={{ mt: 1, mb: 1 }}>
        <TextField select label="Cohorte" value={selectedCohort || ''} onChange={e => setSelectedCohort(e.target.value)} sx={{ minWidth: { xs: '100%', sm: 240 } }}>
          {cohorts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
      </Box>
      {!isSmall ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Apellido</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Asistencia</TableCell>
              <TableCell>Nota final</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={r.id}>
                <TableCell>{r.apellido}</TableCell>
                <TableCell>{r.nombre}</TableCell>
                <TableCell>
                  {r.academicProfile.seminars[0].sessionDates.map((d, sIdx) => (
                    <Box key={sIdx} sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}>
                      <Checkbox checked={!!r.academicProfile.seminars[0].attendanceRecords[sIdx]} onChange={() => togglePresent(idx, sIdx)} />
                      <Box sx={{ fontSize: 12 }}>{new Date(d).toLocaleDateString()}</Box>
                    </Box>
                  ))}
                </TableCell>
                <TableCell>
                  <TextField size="small" value={r.academicProfile.seminars[0].finalGrade ?? ''} onChange={e => updateGrade(idx, e.target.value)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Box>
          {rows.map((r, idx) => (
            <Card key={r.id} sx={{ mb: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1">{r.apellido}, {r.nombre}</Typography>
                    <Typography variant="body2" sx={{ fontSize: 12 }}>{r.cohort}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">Nota final</Typography>
                    <TextField size="small" value={r.academicProfile.seminars[0].finalGrade ?? ''} onChange={e => updateGrade(idx, e.target.value)} sx={{ width: 80 }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {r.academicProfile.seminars[0].sessionDates.map((d, sIdx) => (
                    <Box key={sIdx} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <Checkbox size="small" checked={!!r.academicProfile.seminars[0].attendanceRecords[sIdx]} onChange={() => togglePresent(idx, sIdx)} />
                      <Box sx={{ fontSize: 12 }}>{new Date(d).toLocaleDateString()}</Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      <Button variant="contained" sx={{ mt: 2 }} onClick={handleSaveConfirm}>Guardar cambios</Button>
      <ConfirmDialog open={confirmOpen} title="Guardar cambios" content="¿Desea guardar los cambios realizados en la planilla?" onClose={() => setConfirmOpen(false)} onConfirm={() => { handleSaveAll(); setConfirmOpen(false) }} />
    </Paper>
  )
}
