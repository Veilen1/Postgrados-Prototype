import React, { useState } from 'react'
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, TextField, Button, IconButton, Checkbox, Grid, Box } from '@mui/material'
import ConfirmDialog from '../components/ConfirmDialog'
import { getPrograms, addProgram, updateProgram, deleteProgram, getCohortsByProgram, addCohort, updateCohort, deleteCohort } from '../components/DataProvider'
import { useNotify } from '../components/NotificationProvider'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

export default function ProgramsPage() {
  const [programs, setPrograms] = useState(getPrograms())
  const [form, setForm] = useState({ name: '', description: '' })
  const { notify } = useNotify()

  const [editingProgramId, setEditingProgramId] = useState(null)
  const [editProgramValues, setEditProgramValues] = useState({ name: '', description: '' })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  // cohort forms per program
  const [cohortForms, setCohortForms] = useState({})
  const [cohortEdits, setCohortEdits] = useState({})

  function refresh() {
    setPrograms(getPrograms())
  }

  function handleAddProgram() {
    if (!form.name) return notify('Nombre del programa requerido', 'error')
    addProgram(form)
    setForm({ name: '', description: '' })
    notify('Programa agregado', 'success')
    refresh()
  }

  function startEditProgram(p) {
    setEditingProgramId(p.id)
    setEditProgramValues({ name: p.name, description: p.description || '' })
  }

  function saveEditProgram() {
    updateProgram(editingProgramId, editProgramValues)
    setEditingProgramId(null)
    notify('Programa actualizado', 'success')
    refresh()
  }

  function confirmDeleteProgram(id) {
    setToDelete({ type: 'program', id })
    setConfirmOpen(true)
  }

  function handleAddCohort(programId) {
    const f = cohortForms[programId] || {}
    if (!f.name) return notify('Nombre de cohorte requerido', 'error')
    addCohort({ programId, name: f.name, id: f.id || undefined, open: !!f.open })
    setCohortForms(prev => ({ ...prev, [programId]: {} }))
    notify('Cohorte agregada', 'success')
    refresh()
  }

  function startEditCohort(cohort) {
    setCohortEdits(prev => ({ ...prev, [cohort.id]: { name: cohort.name, open: !!cohort.open } }))
  }

  function saveEditCohort(cohortId) {
    const v = cohortEdits[cohortId]
    if (!v) return
    updateCohort(cohortId, { name: v.name, open: !!v.open })
    setCohortEdits(prev => { const c = { ...prev }; delete c[cohortId]; return c })
    notify('Cohorte actualizada', 'success')
    refresh()
  }

  function confirmDeleteCohort(id) {
    setToDelete({ type: 'cohort', id })
    setConfirmOpen(true)
  }

  function doDelete() {
    if (!toDelete) return
    if (toDelete.type === 'program') {
      deleteProgram(toDelete.id)
      notify('Programa eliminado (y cohorte(s) relacionadas)', 'info')
    } else if (toDelete.type === 'cohort') {
      deleteCohort(toDelete.id)
      notify('Cohorte eliminada', 'info')
    }
    setToDelete(null)
    setConfirmOpen(false)
    refresh()
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Gestión de Posgrados y Cohortes</Typography>

      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle1">Agregar Posgrado</Typography>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} md={4}><TextField label="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth /></Grid>
          <Grid item xs={12} md={5}><TextField label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth /></Grid>
          <Grid item xs={12} md={3}><Button variant="contained" onClick={handleAddProgram}>Agregar Programa</Button></Grid>
        </Grid>
      </Box>

      {programs.map(p => (
        <Paper key={p.id} sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} md={8}>
              {editingProgramId === p.id ? (
                <>
                  <TextField fullWidth label="Nombre" value={editProgramValues.name} onChange={e => setEditProgramValues({ ...editProgramValues, name: e.target.value })} sx={{ mb: 1 }} />
                  <TextField fullWidth label="Descripción" value={editProgramValues.description} onChange={e => setEditProgramValues({ ...editProgramValues, description: e.target.value })} />
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 'bold' }}>{p.name}</Typography>
                  <Typography variant="body2">{p.description}</Typography>
                </>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {editingProgramId === p.id ? (
                <>
                  <Button onClick={saveEditProgram} sx={{ mr: 1 }}>Guardar</Button>
                  <Button onClick={() => setEditingProgramId(null)}>Cancelar</Button>
                </>
              ) : (
                <>
                  <IconButton onClick={() => startEditProgram(p)} aria-label="Editar programa"><EditIcon /></IconButton>
                  <IconButton onClick={() => confirmDeleteProgram(p.id)} aria-label="Eliminar programa"><DeleteIcon /></IconButton>
                </>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Cohortes</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Abierta</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getCohortsByProgram(p.id).map(co => (
                  <TableRow key={co.id}>
                    <TableCell>
                      {cohortEdits[co.id] ? (
                        <TextField value={cohortEdits[co.id].name} onChange={e => setCohortEdits(prev => ({ ...prev, [co.id]: { ...prev[co.id], name: e.target.value } }))} size="small" />
                      ) : co.name}
                    </TableCell>
                    <TableCell>{co.id}</TableCell>
                    <TableCell>
                      {cohortEdits[co.id] ? (
                        <Checkbox checked={!!cohortEdits[co.id].open} onChange={e => setCohortEdits(prev => ({ ...prev, [co.id]: { ...prev[co.id], open: e.target.checked } }))} />
                      ) : (
                        <Checkbox checked={!!co.open} disabled />
                      )}
                    </TableCell>
                    <TableCell>
                      {cohortEdits[co.id] ? (
                        <>
                          <Button onClick={() => saveEditCohort(co.id)} sx={{ mr: 1 }}>Guardar</Button>
                          <Button onClick={() => setCohortEdits(prev => { const c = { ...prev }; delete c[co.id]; return c })}>Cancelar</Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => startEditCohort(co)} sx={{ mr: 1 }}>Editar</Button>
                          <IconButton onClick={() => confirmDeleteCohort(co.id)} aria-label="Eliminar cohorte"><DeleteIcon /></IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">Agregar cohorte a este programa</Typography>
              <Grid container spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={4}><TextField size="small" placeholder="ID (opcional)" value={(cohortForms[p.id] && cohortForms[p.id].id) || ''} onChange={e => setCohortForms(prev => ({ ...prev, [p.id]: { ...prev[p.id], id: e.target.value } }))} fullWidth /></Grid>
                <Grid item xs={12} md={4}><TextField size="small" placeholder="Nombre" value={(cohortForms[p.id] && cohortForms[p.id].name) || ''} onChange={e => setCohortForms(prev => ({ ...prev, [p.id]: { ...prev[p.id], name: e.target.value } }))} fullWidth /></Grid>
                <Grid item xs={6} md={2}><Checkbox checked={(cohortForms[p.id] && !!cohortForms[p.id].open) || false} onChange={e => setCohortForms(prev => ({ ...prev, [p.id]: { ...prev[p.id], open: e.target.checked } }))} /> Abierta</Grid>
                <Grid item xs={6} md={2}><Button onClick={() => handleAddCohort(p.id)}>Agregar cohorte</Button></Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      ))}

      <ConfirmDialog open={confirmOpen} title={toDelete && toDelete.type === 'program' ? 'Eliminar programa' : 'Eliminar cohorte'} content={toDelete && toDelete.type === 'program' ? '¿Eliminar el programa y las cohortes relacionadas?' : '¿Eliminar esta cohorte? Esto también eliminará los aspirantes de la cohorte.'} onClose={() => setConfirmOpen(false)} onConfirm={doDelete} />
    </Paper>
  )
}
