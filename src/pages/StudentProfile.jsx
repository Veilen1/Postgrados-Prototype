import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getAspirantes, updateAspirante, getMissingDocs, verifyDocument, addFileToAspirante, removeFileFromAspirante, getAuditForAspirante } from '../components/DataProvider'
import { useAuth } from '../components/AuthProvider'
import { Paper, Typography, Chip, Grid, Table, TableHead, TableRow, TableCell, TableBody, Button, Alert, Tabs, Tab, Box, TextField, Divider } from '@mui/material'
import ConfirmDialog from '../components/ConfirmDialog'
import { progressPercent, semaforoColor, attendancePercentage } from '../components/Utils'
import FileInput from '../components/FileInput'
import { useNotify } from '../components/NotificationProvider'

export default function StudentProfile() {
  const { id } = useParams()
  const aspirantes = getAspirantes()
  const initial = aspirantes.find(x => x.id === id)
  const [a, setA] = useState(initial)
  const { notify } = useNotify()
  const { user } = useAuth()
  const canEdit = user && user.role === 'conduccion'
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState({})

  useEffect(() => {
    if (a) setEditValues({ nombre: a.nombre || '', apellido: a.apellido || '', email: a.email || '', phoneMobile: a.phoneMobile || '', address: a.address || '', career: a.career || '' })
  }, [a])

  const [tab, setTab] = useState(0)
  const [docs, setDocs] = useState([])
  const [audit, setAudit] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDeleteKey, setToDeleteKey] = useState(null)
  const [adminFileKey, setAdminFileKey] = useState('')

  useEffect(() => {
    if (a) setDocs(getMissingDocs(a))
    else setDocs([])
    if (a) setAudit(getAuditForAspirante(a.id))
    else setAudit([])
  }, [a])

  useEffect(() => {
    // refresh aspirante data from storage when id changes
    const arr = getAspirantes()
    setA(arr.find(x => x.id === id))
  }, [id])

  if (!a) return <Typography>Alumno no encontrado</Typography>

  // compute progress composite percent
  const overall = progressPercent(a)
  const color = semaforoColor(overall)

  const now = new Date()
  // Defensive access: aspirante may not have academicProfile or seminars defined
  const seminars = (a.academicProfile && Array.isArray(a.academicProfile.seminars)) ? a.academicProfile.seminars : []
  const tutorias = (a.academicProfile && Array.isArray(a.academicProfile.tutorias)) ? a.academicProfile.tutorias : []
  const tfi = (a.academicProfile && a.academicProfile.tfi) ? a.academicProfile.tfi : null
  const soonDeadlines = seminars.flatMap(s => s.deadline ? [new Date(s.deadline)] : []).filter(d => d > now && (d - now) / (1000 * 3600 * 24) <= 30)

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1 }}>
            <Box>
              <Typography variant="h5">{a.nombre} {a.apellido}</Typography>
              <Typography variant="body2">Cohorte: {a.cohort} — DNI: {a.dni}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label={a.legajoStatus} color={a.legajoStatus === 'completo' ? 'success' : 'warning'} />
            </Box>
          </Box>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mt: 2 }}>
            <Tab label="Información" />
            <Tab label="Legajo" />
            <Tab label="Académico" />
            <Tab label="Tutorías / TFI" />
          </Tabs>

          <Divider sx={{ mb: 2 }} />

          {tab === 0 && (
            <Box>
              {editing ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField label="Nombre" value={editValues.nombre} onChange={e => setEditValues({ ...editValues, nombre: e.target.value })} />
                  <TextField label="Apellido" value={editValues.apellido} onChange={e => setEditValues({ ...editValues, apellido: e.target.value })} />
                  <TextField label="Email" value={editValues.email} onChange={e => setEditValues({ ...editValues, email: e.target.value })} />
                  <TextField label="Teléfono móvil" value={editValues.phoneMobile} onChange={e => setEditValues({ ...editValues, phoneMobile: e.target.value })} />
                  <TextField label="Domicilio" value={editValues.address} onChange={e => setEditValues({ ...editValues, address: e.target.value })} />
                  <TextField label="Carrera" value={editValues.career} onChange={e => setEditValues({ ...editValues, career: e.target.value })} />
                  <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, mt: 1 }}>
                    <Button variant="contained" onClick={() => {
                      const updated = { ...a, ...editValues }
                      const ok = updateAspirante(a.id, updated)
                      const arr = getAspirantes()
                      setA(arr.find(x => x.id === a.id))
                      notify(ok ? 'Cambios guardados' : 'Error al guardar', ok ? 'success' : 'error')
                      setEditing(false)
                    }}>Guardar</Button>
                    <Button variant="outlined" onClick={() => { setEditing(false); setEditValues({ nombre: a.nombre || '', apellido: a.apellido || '', email: a.email || '', phoneMobile: a.phoneMobile || '', address: a.address || '', career: a.career || '' }) }}>Cancelar</Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography>Correo: {a.email}</Typography>
                  <Typography>Teléfono: {a.phoneMobile}</Typography>
                  <Typography>Domicilio: {a.address}</Typography>
                  <Typography>Carrera: {a.career}</Typography>
                  {canEdit && <Button sx={{ mt: 1 }} variant="outlined" onClick={() => setEditing(true)}>Editar</Button>}
                </Box>
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="subtitle1">Documentos requeridos</Typography>
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {canEdit && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Button variant="contained" size="small" onClick={() => {
                      const toVerify = docs.filter(d => d.present && !d.verified)
                      let count = 0
                      toVerify.forEach(d => { const ok = verifyDocument(a.id, d.key, user && user.name); if (ok) count++ })
                      const arr = getAspirantes()
                      const updated = arr.find(x => x.id === a.id)
                      setA(updated)
                      setDocs(getMissingDocs(updated))
                      setAudit(getAuditForAspirante(a.id))
                      notify(`${count} documentos verificados`, count > 0 ? 'success' : 'info')
                    }}>Verificar todo</Button>
                  </Box>
                )}
                {docs.map(d => (
                  <Box key={d.key} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 1, p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                    <Box sx={{ flex: 1, minWidth: { sm: 220 } }}>{d.label}</Box>
                    <Box sx={{ minWidth: { sm: 120 } }}>{d.present ? <Chip label={d.verified ? 'Verificado' : 'Cargado'} color={d.verified ? 'success' : 'info'} size="small" /> : <Chip label="Pendiente" color="warning" size="small" />}</Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {d.present && <Button component="a" href={d.file && d.file.data || '#'} target="_blank" rel="noopener noreferrer" size="small">Ver</Button>}
                      <FileInput id={`${a.id}-${d.key}`} accept=".pdf,.jpg,.png" onChange={async e => {
                      const file = e.target.files && e.target.files[0]
                      if (!file) return
                      const read = () => new Promise((resolve, reject) => {
                        const fr = new FileReader()
                        fr.onload = () => resolve(fr.result)
                        fr.onerror = reject
                        fr.readAsDataURL(file)
                      })
                      try {
                        const data = await read()
                        const existing = a.files || []
                        const filtered = existing.filter(f => f.key !== d.key)
                        const now = new Date().toISOString()
                        const toSave = [...filtered, { key: d.key, name: file.name, data, uploadedAt: now, uploadedBy: user ? user.name : 'self' }]
                        const ok = updateAspirante(a.id, { files: toSave })
                        const arr = getAspirantes()
                        const updated = arr.find(x => x.id === a.id)
                        setA(updated)
                        setDocs(getMissingDocs(updated))
                        notify(ok ? 'Archivo subido' : 'Error al subir archivo', ok ? 'success' : 'error')
                        if (updated && updated.legajoStatus === 'completo') notify('Legajo completado', 'success')
                      } catch (err) {
                        console.error('file read failed', err)
                        notify('No se pudo leer el archivo', 'error')
                      }
                      e.target.value = null
                      }} />
                      {canEdit && d.present && !d.verified && <Button size="small" variant="outlined" onClick={() => { const ok = verifyDocument(a.id, d.key, user && user.name); if (ok) { const arr = getAspirantes(); setA(arr.find(x => x.id === a.id)); setDocs(getMissingDocs(arr.find(x => x.id === a.id))); notify('Documento verificado', 'success') } else notify('No se pudo verificar', 'error') }}>Verificar</Button>}
                      {canEdit && d.present && <Button size="small" color="error" onClick={() => { setToDeleteKey(d.key); setConfirmOpen(true) }}>Eliminar</Button>}
                    </Box>
                  </Box>
                ))}
                {canEdit && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField size="small" label="Clave (key)" placeholder="ej: dni" value={adminFileKey} onChange={e => setAdminFileKey(e.target.value)} />
                    <FileInput id={`admin-${a.id}-add`} accept=".pdf,.jpg,.png" onChange={async e => {
                      const file = e.target.files && e.target.files[0]
                      if (!file) return
                      const key = (adminFileKey || '').trim()
                      const read = () => new Promise((resolve, reject) => {
                        const fr = new FileReader()
                        fr.onload = () => resolve(fr.result)
                        fr.onerror = reject
                        fr.readAsDataURL(file)
                      })
                      try {
                        const data = await read()
                        const now = new Date().toISOString()
                        const fileObj = { key: key || `file-${now}`, name: file.name, data, uploadedAt: now, uploadedBy: user ? user.name : 'admin' }
                        const ok = addFileToAspirante(a.id, fileObj)
                        if (ok) {
                          const arr = getAspirantes()
                          const updated = arr.find(x => x.id === a.id)
                          setA(updated)
                          setDocs(getMissingDocs(updated))
                          notify('Archivo agregado', 'success')
                          setAdminFileKey('')
                        } else notify('Error agregando archivo', 'error')
                      } catch (err) {
                        console.error(err)
                        notify('No se pudo leer el archivo', 'error')
                      }
                      e.target.value = null
                    }} />
                  </Box>
                )}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Historial de acciones</Typography>
                  {audit && audit.length > 0 ? (
                    audit.map((it, ix) => (
                      <Typography key={ix} variant="body2">{new Date(it.at).toLocaleString()} — {it.action} {it.key ? `: ${it.key}` : it.keyOrName ? `: ${it.keyOrName}` : ''} — por {it.by}</Typography>
                    ))
                  ) : (
                    <Typography variant="body2">No hay registros</Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Typography variant="h6">Seminarios</Typography>
              {soonDeadlines.length > 0 && (
                <Alert severity="warning">Alerta: Tenés seminarios con vencimiento en los próximos 30 días.</Alert>
              )}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Asistencia %</TableCell>
                    <TableCell>Nota final</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seminars.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{attendancePercentage(s)}%</TableCell>
                      <TableCell>{s.finalGrade ?? '-'}</TableCell>
                      <TableCell>{s.approved ? 'Aprobado' : 'Pendiente'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {tab === 3 && (
            <Box>
              <Typography variant="h6">Tutorías recientes</Typography>
              {tutorias && tutorias.length > 0 ? (
                tutorias.map(t => (
                  <Typography key={t.id} variant="body2">{new Date(t.date).toLocaleDateString()} — {t.note}</Typography>
                ))
              ) : (
                <Typography>No hay tutorías registradas</Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Trabajo Final / Tesis</Typography>
                {tfi ? (
                  <div>
                    <Typography>Estado: {tfi.status}</Typography>
                    {tfi.title && <Typography>Título: {tfi.title}</Typography>}
                  </div>
                ) : <Typography>No hay información</Typography>}
              </Box>
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography>Semáforo de avance</Typography>
          <Box sx={{ width: { xs: 100, sm: 120 }, height: { xs: 100, sm: 120 }, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: { xs: 14, sm: 18 } }}>
            {overall}%
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">Archivos adjuntos</Typography>
          {a.files && a.files.length > 0 ? (
            a.files.map((f, idx) => (
              <div key={idx}>
                <Typography>{f.name} <Button component="a" href={f.data || '#'} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${f.name}`}>Ver/Descargar</Button></Typography>
              </div>
            ))
          ) : (
            <Typography>No hay archivos cargados</Typography>
          )}
        </Grid>
      </Grid>
      <ConfirmDialog open={confirmOpen} title="Eliminar archivo" content="¿Estás seguro que deseas eliminar este archivo del legajo?" onClose={() => setConfirmOpen(false)} onConfirm={() => {
        if (!toDeleteKey) { setConfirmOpen(false); return }
        const ok = removeFileFromAspirante(a.id, toDeleteKey)
        if (ok) {
          const arr = getAspirantes()
          const updated = arr.find(x => x.id === a.id)
          setA(updated)
          setDocs(getMissingDocs(updated))
          notify('Archivo eliminado', 'info')
        } else notify('No se pudo eliminar', 'error')
        setToDeleteKey(null)
        setConfirmOpen(false)
      }} />
    </Paper>
  )
}
