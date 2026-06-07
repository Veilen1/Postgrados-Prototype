import React, { useState } from 'react'
import { Paper, Typography, Grid, TextField, Button, MenuItem, Alert, List, ListItem, IconButton, FormHelperText, Box } from '@mui/material'
import { addAspirante, getCohorts, getCohortById, getInvite } from '../components/DataProvider'
import { useLocation } from 'react-router-dom'
import { useNotify } from '../components/NotificationProvider'
import { useNavigate } from 'react-router-dom'
import DeleteIcon from '@mui/icons-material/Delete'
import FileInput from '../components/FileInput'

const careers = ['Especialización en Sistemas', 'Maestría en Ingeniería']
const howFoundOptions = ['sitio web', 'egresados de la UTN', 'comentarios de colegas', 'otros']

export default function AspForm() {
  const cohorts = getCohorts()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const inviteToken = params.get('invite') || params.get('token')
  const invite = inviteToken ? getInvite(inviteToken) : null
  const defaultCohort = (invite && invite.cohortId) || (cohorts && cohorts.length > 0 ? cohorts[0].id : '2025')
  const [form, setForm] = useState({ career: careers[0], apellido: '', nombre: '', nacionalidad: '', dni: '', phoneMobile: '', phoneHome: '', email: '', altEmail: '', address: '', city: '', province: '', country: '', degreeTitle: '', howFound: howFoundOptions[0], motivations: '', files: [], scholarship: { type: null, file: null }, cohort: defaultCohort })
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()

  const { notify } = useNotify()

  function handleFileInput(e, keyHint) {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const item = { key: keyHint || f.name, name: f.name, data: reader.result }
      setForm(prev => ({ ...prev, files: [...(prev.files || []), item] }))
    }
    reader.readAsDataURL(f)
  }

  function removeFile(idx) {
    setForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))
  }

  function validate() {
    const errors = {}
    if (!form.apellido) errors.apellido = 'Apellido requerido'
    if (!form.nombre) errors.nombre = 'Nombre requerido'
    if (!form.email) errors.email = 'Email requerido'
    if (!form.dni) errors.dni = 'DNI o pasaporte requerido'
    return errors
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      Object.keys(errs).forEach(k => notify(errs[k], 'error'))
      return
    }

    const cohortObj = getCohortById(form.cohort)
    if (cohortObj && !cohortObj.open) {
      notify('La inscripción para la cohorte seleccionada está cerrada.', 'warning')
      return
    }
    const obj = { ...form }
    addAspirante(obj)
    setSuccess('Preinscripción registrada. Se guardó en la demo (localStorage).')
    notify('Preinscripción registrada', 'success')
    setTimeout(() => navigate('/'), 1200)
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Formulario de Preinscripción</Typography>
      {inviteToken && !invite && <Alert severity="warning" sx={{ my: 2 }}>El enlace de invitación no es válido o expiró.</Alert>}
      {success && <Alert severity="success" sx={{ my: 2 }}>{success}</Alert>}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField label="Carrera" select fullWidth value={form.career} onChange={e => setForm({ ...form, career: e.target.value })}>
              {careers.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Cohorte" select fullWidth value={form.cohort} onChange={e => setForm({ ...form, cohort: e.target.value })}>
              {cohorts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}><TextField label="Apellido" fullWidth value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} required inputProps={{ 'aria-label': 'Apellido' }} helperText={!form.apellido ? 'Requerido' : ''} error={!form.apellido} autoFocus /></Grid>
          <Grid item xs={6} md={3}><TextField label="Nombre" fullWidth value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required inputProps={{ 'aria-label': 'Nombre' }} helperText={!form.nombre ? 'Requerido' : ''} error={!form.nombre} /></Grid>

          <Grid item xs={12}><TextField label="Nacionalidad" fullWidth value={form.nacionalidad} onChange={e => setForm({ ...form, nacionalidad: e.target.value })} /></Grid>
          <Grid item xs={12} md={6}><TextField label="DNI / Pasaporte" fullWidth value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} required inputProps={{ 'aria-label': 'DNI / Pasaporte' }} helperText={!form.dni ? 'Requerido' : ''} error={!form.dni} /></Grid>
          <Grid item xs={12} md={6}><TextField label="Teléfono móvil" fullWidth value={form.phoneMobile} onChange={e => setForm({ ...form, phoneMobile: e.target.value })} /></Grid>
          <Grid item xs={12} md={6}><TextField label="Teléfono fijo" fullWidth value={form.phoneHome} onChange={e => setForm({ ...form, phoneHome: e.target.value })} /></Grid>

          <Grid item xs={12}><TextField label="Correo electrónico" fullWidth value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required inputProps={{ 'aria-label': 'Correo electrónico' }} helperText={!form.email ? 'Requerido' : ''} error={!form.email} /></Grid>
          <Grid item xs={12}><TextField label="Correo alternativo" fullWidth value={form.altEmail} onChange={e => setForm({ ...form, altEmail: e.target.value })} /></Grid>

          <Grid item xs={12}><TextField label="Domicilio" fullWidth value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Grid>
          <Grid item xs={12} md={4}><TextField label="Ciudad" fullWidth value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></Grid>
          <Grid item xs={12} md={4}><TextField label="Provincia" fullWidth value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} /></Grid>
          <Grid item xs={12} md={4}><TextField label="País" fullWidth value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></Grid>

          <Grid item xs={12}><TextField label="Título de grado" fullWidth value={form.degreeTitle} onChange={e => setForm({ ...form, degreeTitle: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField label="Cómo se enteró" select fullWidth value={form.howFound} onChange={e => setForm({ ...form, howFound: e.target.value })}>
            {howFoundOptions.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
          </TextField></Grid>

          <Grid item xs={12}><TextField label="Motivaciones" multiline rows={3} fullWidth value={form.motivations} onChange={e => setForm({ ...form, motivations: e.target.value })} /></Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Adjuntar copia del DNI</Typography>
            <FileInput id="file-dni" accept="application/pdf,image/*" onChange={e => handleFileInput(e, 'dni')} />
            <FormHelperText>Formato PDF o imagen. Campo recomendado.</FormHelperText>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Adjuntar formulario firmado</Typography>
            <FileInput id="file-form" accept="application/pdf,image/*" onChange={e => handleFileInput(e, 'formulario')} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Adjuntar copia de título</Typography>
            <FileInput id="file-titulo" accept="application/pdf,image/*" onChange={e => handleFileInput(e, 'titulo')} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Adjuntar CUIT/CUIL</Typography>
            <FileInput id="file-cuil" accept="application/pdf,image/*" onChange={e => handleFileInput(e, 'cuil')} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Adjuntar partida de nacimiento</Typography>
            <FileInput id="file-partida" accept="application/pdf,image/*" onChange={e => handleFileInput(e, 'partidaNacimiento')} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">¿Solicita beca?</Typography>
            <TextField select fullWidth value={form.scholarship?.type || ''} onChange={e => setForm({ ...form, scholarship: { ...form.scholarship, type: e.target.value } })}>
              <MenuItem value="">No</MenuItem>
              <MenuItem value="30">30%</MenuItem>
              <MenuItem value="100">100%</MenuItem>
            </TextField>
            {form.scholarship?.type && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Adjuntar formulario de beca</Typography>
                <FileInput id="file-beca" accept="application/pdf,image/*" onChange={e => handleFileInput(e, 'beca')} />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Archivos cargados</Typography>
            <List>
              {(form.files || []).map((f, idx) => (
                <ListItem key={f.name + idx} secondaryAction={<IconButton edge="end" onClick={() => removeFile(idx)} aria-label={`Eliminar archivo ${f.name}`}><DeleteIcon /></IconButton>}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', width: '100%' }}>
                    <div>{f.name}</div>
                    <div>
                      {f.data && <Button component="a" href={f.data} target="_blank" rel="noopener noreferrer" size="small">Ver</Button>}
                    </div>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" type="submit">Enviar preinscripción</Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}
