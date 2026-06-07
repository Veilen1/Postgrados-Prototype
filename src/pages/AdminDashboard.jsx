import React, { useState } from 'react'
import { Paper, Typography, Grid, Card, CardContent, LinearProgress, Button, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { getAspirantes, getCohorts, getCohortById, toggleCohortOpen, getAspirantesByCohort, sendRemindersToDocentes, generateInvite } from '../components/DataProvider'
import { downloadCSV } from '../components/ExportCSV'
import { Link } from 'react-router-dom'
import { useNotify } from '../components/NotificationProvider'

function groupByCohort(aspirantes) {
  const map = {}
  aspirantes.forEach(a => {
    map[a.cohort] = (map[a.cohort] || 0) + 1
  })
  return map
}

export default function AdminDashboard() {
  const [aspirantes, setAspirantes] = useState(getAspirantes())
  const [cohorts, setCohorts] = useState(getCohorts())
  const [inviteCohort, setInviteCohort] = useState(cohorts && cohorts.length ? cohorts[0].id : '')
  const { notify } = useNotify()
  const total = aspirantes.length
  const completos = aspirantes.filter(a => a.legajoStatus === 'completo').length
  const pendientes = total - completos
  const byC = groupByCohort(aspirantes)
  const activos = aspirantes.filter(a => getCohortById(a.cohort)?.open).length

  function refresh() {
    setAspirantes(getAspirantes())
    setCohorts(getCohorts())
  }

  return (
    <div>
      <Typography variant="h5" sx={{ mb: 2 }}>Panel de Conducción</Typography>
      <Button variant="outlined" onClick={() => { const n = sendRemindersToDocentes(); notify(`${n} recordatorios enviados (simulados)`, 'info') }} sx={{ mb: 2 }}>Enviar recordatorios a docentes</Button>
      <Button component={Link} to="/admin/students" variant="contained" sx={{ mb: 2, ml: 2 }}>Gestionar estudiantes</Button>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="invite-cohort-label">Cohorte</InputLabel>
          <Select labelId="invite-cohort-label" value={inviteCohort} label="Cohorte" onChange={e => setInviteCohort(e.target.value)}>
            {cohorts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="outlined" sx={{ ml: 1 }} onClick={() => {
          if (!inviteCohort) return notify('Seleccioná una cohorte', 'warning')
          const token = generateInvite(inviteCohort)
          const url = `${window.location.origin}/preinscripcion?invite=${token}`
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url)
          notify('Enlace de invitación generado y copiado al portapapeles', 'info')
        }}>Generar enlace</Button>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}><Card><CardContent>
          <Typography variant="h6">Inscripciones totales</Typography>
          <Typography variant="h4">{total}</Typography>
        </CardContent></Card></Grid>
        <Grid item xs={6} md={4}><Card><CardContent>
          <Typography variant="h6">Legajos completos</Typography>
          <Typography variant="h4">{completos}</Typography>
        </CardContent></Card></Grid>
        <Grid item xs={6} md={4}><Card><CardContent>
          <Typography variant="h6">Pendientes</Typography>
          <Typography variant="h4">{pendientes}</Typography>
        </CardContent></Card></Grid>

        <Grid item xs={12}><Paper sx={{ p: 2 }}>
          <Typography variant="h6">Inscripciones por cohorte</Typography>
          {cohorts.map(c => (
            <Box key={c.id} sx={{ mt: 2, mb: 1 }}>
              <Typography sx={{ fontWeight: 'bold' }}>{c.name} — {byC[c.id] || 0} inscritos</Typography>
              <LinearProgress variant="determinate" value={(byC[c.id] || 0) / (total || 1) * 100} sx={{ height: 12, borderRadius: 6, mt: 1 }} />
              <Button component={Link} to={`/cohort/${c.id}`} sx={{ mt: 1, mr: 1 }}>Ir a cohorte</Button>
              <Button variant="outlined" onClick={() => { toggleCohortOpen(c.id); refresh() }} sx={{ mt: 1 }}>{getCohortById(c.id)?.open ? 'Cerrar inscripción' : 'Abrir inscripción'}</Button>
              <Button sx={{ mt: 1, ml: 1 }} onClick={() => downloadCSV(`${c.id}_inscriptos.csv`, getAspirantesByCohort(c.id).map(a => ({ id: a.id, apellido: a.apellido, nombre: a.nombre, email: a.email, legajo: a.legajoStatus })))}>
                Exportar CSV
              </Button>
            </Box>
          ))}
        </Paper></Grid>
      </Grid>
    </div>
  )
}
