import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAspirantes, saveAspirantes, deleteAspirante, updateAspirante, getAspirantesByCohort, getCohortById, getProgramById } from '../components/DataProvider'
import { Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell, IconButton, TextField, Button } from '@mui/material'
import ConfirmDialog from '../components/ConfirmDialog'
import { Link } from 'react-router-dom'
import { useNotify } from '../components/NotificationProvider'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

export default function CohortPage() {
  const { cohort } = useParams()
  const initial = getAspirantesByCohort(cohort)
  const [rows, setRows] = useState(initial)
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const { notify } = useNotify()

  function refresh() {
    const arr = getAspirantes().filter(a => a.cohort === cohort)
    setRows(arr)
  }

  function handleDelete(id) {
    setToDelete(id)
    setConfirmOpen(true)
  }

  function doDelete() {
    if (!toDelete) return
    deleteAspirante(toDelete)
    setToDelete(null)
    setConfirmOpen(false)
    refresh()
    notify('Aspirante eliminado', 'info')
  }

  function startEdit(r) {
    setEditingId(r.id)
    setEditValues({ nombre: r.nombre, apellido: r.apellido, email: r.email })
  }

  function saveEdit() {
    updateAspirante(editingId, editValues)
    setEditingId(null)
    refresh()
  }

  const cohortObj = getCohortById(cohort)
  const program = cohortObj ? getProgramById(cohortObj.programId) : null

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">{cohortObj ? cohortObj.name : `Cohorte ${cohort}`} {program ? `— ${program.name}` : ''}</Typography>
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
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell>{editingId === r.id ? <TextField value={editValues.apellido} onChange={e => setEditValues({ ...editValues, apellido: e.target.value })} /> : r.apellido}</TableCell>
              <TableCell>{editingId === r.id ? <TextField value={editValues.nombre} onChange={e => setEditValues({ ...editValues, nombre: e.target.value })} /> : r.nombre}</TableCell>
              <TableCell>{editingId === r.id ? <TextField value={editValues.email} onChange={e => setEditValues({ ...editValues, email: e.target.value })} /> : r.email}</TableCell>
              <TableCell>{r.legajoStatus}</TableCell>
              <TableCell>
                <IconButton component={Link} to={`/student/${r.id}`} aria-label={`Ver ${r.nombre}`}><VisibilityIcon /></IconButton>
                {editingId === r.id ? (
                  <>
                    <Button onClick={saveEdit} aria-label={`Guardar ${r.nombre}`}>Guardar</Button>
                    <Button onClick={() => setEditingId(null)} aria-label={`Cancelar edición ${r.nombre}`}>Cancelar</Button>
                  </>
                ) : (
                  <>
                    <IconButton onClick={() => startEdit(r)} aria-label={`Editar ${r.nombre}`}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(r.id)} aria-label={`Eliminar ${r.nombre}`}><DeleteIcon /></IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog open={confirmOpen} title="Eliminar aspirante" content="¿Estás seguro que deseas eliminar este aspirante? Esta acción no se puede deshacer." onClose={() => setConfirmOpen(false)} onConfirm={doDelete} />
    </Paper>
  )
}
