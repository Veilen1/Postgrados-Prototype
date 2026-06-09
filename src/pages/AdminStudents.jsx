import React, { useState, useMemo } from 'react'
import { getAspirantes, getCohorts, deleteAspirante } from '../components/DataProvider'
import { useAuth } from '../components/AuthProvider'
import ConfirmDialog from '../components/ConfirmDialog'
import DeleteIcon from '@mui/icons-material/Delete'
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, TextField, IconButton, MenuItem, Select, InputLabel, FormControl, Box } from '@mui/material'
import { Link } from 'react-router-dom'
import VisibilityIcon from '@mui/icons-material/Visibility'

export default function AdminStudents() {
  const { user } = useAuth()
  const canDelete = user && user.role === 'conduccion'
  const [q, setQ] = useState('')
  const aspirantes = getAspirantes()
  const cohorts = getCohorts()
  const [cohortFilter, setCohortFilter] = useState('')
  const [legajoFilter, setLegajoFilter] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDeleteId, setToDeleteId] = useState(null)

  const filtered = useMemo(() => {
    const s = (q || '').toLowerCase()
    return aspirantes.filter(a => {
      if (cohortFilter && a.cohort !== cohortFilter) return false
      if (legajoFilter && a.legajoStatus !== legajoFilter) return false
      if (!s) return true
      return (`${a.nombre} ${a.apellido}`.toLowerCase().includes(s) || (a.dni || '').includes(s) || (a.email || '').toLowerCase().includes(s))
    })
  }, [q, aspirantes, cohortFilter, legajoFilter])

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Gestión de estudiantes</Typography>
      <Box sx={{ mt: 1, mb: 1, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: 'center' }}>
        <TextField label="Buscar" value={q} onChange={e => setQ(e.target.value)} sx={{ minWidth: { xs: '100%', sm: 300 } }} />
        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }} size="small">
          <InputLabel id="cohort-filter-label">Cohorte</InputLabel>
          <Select labelId="cohort-filter-label" value={cohortFilter} label="Cohorte" onChange={e => setCohortFilter(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {cohorts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: { xs: '100%', sm: 160 } }} size="small">
          <InputLabel id="legajo-filter-label">Legajo</InputLabel>
          <Select labelId="legajo-filter-label" value={legajoFilter} label="Legajo" onChange={e => setLegajoFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="completo">Completo</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Apellido</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Legajo</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.apellido}</TableCell>
                <TableCell>{a.nombre}</TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.legajoStatus}</TableCell>
                <TableCell>
                  <IconButton component={Link} to={`/student/${a.id}`} aria-label={`Ver ${a.nombre}`}><VisibilityIcon /></IconButton>
                  {canDelete && <IconButton aria-label={`Eliminar ${a.nombre}`} onClick={() => { setToDeleteId(a.id); setConfirmOpen(true) }}><DeleteIcon /></IconButton>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <ConfirmDialog open={confirmOpen} title="Eliminar alumno" content="¿Confirma que desea eliminar este alumno? Esta acción no se puede deshacer." onClose={() => setConfirmOpen(false)} onConfirm={() => {
        if (!toDeleteId) { setConfirmOpen(false); return }
        deleteAspirante(toDeleteId)
        setConfirmOpen(false)
        window.location.reload()
      }} />
    </Paper>
  )
}
