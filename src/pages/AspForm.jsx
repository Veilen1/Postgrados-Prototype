import React, { useState } from 'react'
import { Paper, Typography, Grid, TextField, Button, MenuItem, Alert, List, ListItem, IconButton, FormHelperText, Box, Stepper, Step, StepLabel } from '@mui/material'
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
  const DRAFT_KEY = 'preinscripcion_draft'

  const defaultForm = { career: careers[0], apellido: '', nombre: '', nacionalidad: '', dni: '', phoneMobile: '', phoneHome: '', email: '', altEmail: '', address: '', city: '', province: '', country: '', degreeTitle: '', howFound: howFoundOptions[0], motivations: '', files: [], scholarship: { type: null, file: null }, cohort: defaultCohort }

  // Initialize form from a draft if present in localStorage
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.form) return { ...defaultForm, ...parsed.form }
        return { ...defaultForm, ...parsed }
      }
    } catch (e) { /* ignore */ }
    return defaultForm
  })
  const [success, setSuccess] = useState(null)
  const [step, setStep] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.step === 'number') return parsed.step
      }
    } catch (e) { /* ignore */ }
    return 0
  })
  const steps = ['Datos Personales', 'Datos Académicos', 'Documentación', 'Resumen']
  const navigate = useNavigate()

  const { notify } = useNotify()

  // Persist draft to localStorage
  function saveDraft(f, s) {
    try {
      const payload = { form: f, step: typeof s === 'number' ? s : step, savedAt: new Date().toISOString() }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    } catch (e) { /* ignore */ }
  }

  // Helper to update form state and persist draft
  function setFormAndSave(updater) {
    setForm(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      saveDraft(next)
      return next
    })
  }

  function handleFileInput(e, keyHint) {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const item = { key: keyHint || f.name, name: f.name, data: reader.result }
      setForm(prev => {
        const next = { ...prev, files: [...(prev.files || []), item] }
        // persist draft immediately when file added
        saveDraft(next)
        return next
      })
    }
    reader.readAsDataURL(f)
  }

  function removeFile(idx) {
    setForm(prev => {
      const next = { ...prev, files: prev.files.filter((_, i) => i !== idx) }
      saveDraft(next)
      return next
    })
  }

  function validate() {
    const errors = {}
    if (!form.apellido) errors.apellido = 'Apellido requerido'
    if (!form.nombre) errors.nombre = 'Nombre requerido'
    if (!form.email) errors.email = 'Email requerido'
    if (!form.dni) errors.dni = 'DNI o pasaporte requerido'
    return errors
  }

  function validateStep(s) {
    // minimal per-step validation. Keep heavy validation for final submit
    const errors = {}
    if (s === 0) {
      if (!form.apellido) errors.apellido = 'Apellido requerido'
      if (!form.nombre) errors.nombre = 'Nombre requerido'
      if (!form.email) errors.email = 'Email requerido'
      if (!form.dni) errors.dni = 'DNI o pasaporte requerido'
    }
    return errors
  }

  function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault()
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
    // remove draft on successful submit
    try { localStorage.removeItem(DRAFT_KEY) } catch (e) { }
    setSuccess('Preinscripción registrada. Se guardó en la demo (localStorage).')
    notify('Preinscripción registrada', 'success')
    setTimeout(() => navigate('/'), 1200)
  }

  function handleNext() {
    const errs = validateStep(step)
    if (Object.keys(errs).length > 0) {
      Object.keys(errs).forEach(k => notify(errs[k], 'error'))
      return
    }
    setStep(s => {
      const next = Math.min(s + 1, steps.length - 1)
      // persist step and current form
      saveDraft(form, next)
      return next
    })
  }

  function handleBack() {
    setStep(s => {
      const next = Math.max(s - 1, 0)
      saveDraft(form, next)
      return next
    })
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
      <Typography variant="h6">Formulario de Preinscripción</Typography>
      {inviteToken && !invite && <Alert severity="warning" sx={{ my: 2 }}>El enlace de invitación no es válido o expiró.</Alert>}
      {success && <Alert severity="success" sx={{ my: 2 }}>{success}</Alert>}

      <Stepper activeStep={step} alternativeLabel sx={{ py: 2 }}>
        {steps.map(s => (
          <Step key={s}><StepLabel>{s}</StepLabel></Step>
        ))}
      </Stepper>

      <div>
        <Grid container spacing={2} sx={{ mt: 1 }}>

          {/* Step 0: Datos Personales */}
          {step === 0 && (
            <>
              <Grid item xs={6} md={3}><TextField label="Apellido" fullWidth value={form.apellido} onChange={e => setFormAndSave({ apellido: e.target.value })} required inputProps={{ 'aria-label': 'Apellido' }} helperText={!form.apellido ? 'Requerido' : ''} error={!form.apellido} autoFocus /></Grid>
              <Grid item xs={6} md={3}><TextField label="Nombre" fullWidth value={form.nombre} onChange={e => setFormAndSave({ nombre: e.target.value })} required inputProps={{ 'aria-label': 'Nombre' }} helperText={!form.nombre ? 'Requerido' : ''} error={!form.nombre} /></Grid>

              <Grid item xs={12}><TextField label="Nacionalidad" fullWidth value={form.nacionalidad} onChange={e => setFormAndSave({ nacionalidad: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}><TextField label="DNI / Pasaporte" fullWidth value={form.dni} onChange={e => setFormAndSave({ dni: e.target.value })} required inputProps={{ 'aria-label': 'DNI / Pasaporte' }} helperText={!form.dni ? 'Requerido' : ''} error={!form.dni} /></Grid>
              <Grid item xs={12} md={6}><TextField label="Teléfono móvil" fullWidth value={form.phoneMobile} onChange={e => setFormAndSave({ phoneMobile: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}><TextField label="Teléfono fijo" fullWidth value={form.phoneHome} onChange={e => setFormAndSave({ phoneHome: e.target.value })} /></Grid>

              <Grid item xs={12}><TextField label="Correo electrónico" fullWidth value={form.email} onChange={e => setFormAndSave({ email: e.target.value })} required inputProps={{ 'aria-label': 'Correo electrónico' }} helperText={!form.email ? 'Requerido' : ''} error={!form.email} /></Grid>
              <Grid item xs={12}><TextField label="Correo alternativo" fullWidth value={form.altEmail} onChange={e => setFormAndSave({ altEmail: e.target.value })} /></Grid>

              <Grid item xs={12}><TextField label="Domicilio" fullWidth value={form.address} onChange={e => setFormAndSave({ address: e.target.value })} /></Grid>
              <Grid item xs={12} md={4}><TextField label="Ciudad" fullWidth value={form.city} onChange={e => setFormAndSave({ city: e.target.value })} /></Grid>
              <Grid item xs={12} md={4}><TextField label="Provincia" fullWidth value={form.province} onChange={e => setFormAndSave({ province: e.target.value })} /></Grid>
              <Grid item xs={12} md={4}><TextField label="País" fullWidth value={form.country} onChange={e => setFormAndSave({ country: e.target.value })} /></Grid>

              <Grid item xs={12}><TextField label="Motivaciones" multiline rows={3} fullWidth value={form.motivations} onChange={e => setFormAndSave({ motivations: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField label="Cómo se enteró" select fullWidth value={form.howFound} onChange={e => setFormAndSave({ howFound: e.target.value })}>
                {howFoundOptions.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </TextField></Grid>
            </>
          )}

          {/* Step 1: Datos Académicos */}
          {step === 1 && (
            <>
              <Grid item xs={12} md={6}>
                <TextField label="Carrera" select fullWidth value={form.career} onChange={e => setFormAndSave({ career: e.target.value })}>
                  {careers.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Cohorte" select fullWidth value={form.cohort} onChange={e => setFormAndSave({ cohort: e.target.value })}>
                  {cohorts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12}><TextField label="Título de grado" fullWidth value={form.degreeTitle} onChange={e => setFormAndSave({ degreeTitle: e.target.value })} /></Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">¿Solicita beca?</Typography>
                <TextField select fullWidth value={form.scholarship?.type || ''} onChange={e => setFormAndSave({ scholarship: { ...form.scholarship, type: e.target.value } })}>
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
            </>
          )}

          {/* Step 2: Documentación */}
          {step === 2 && (
            <>
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
            </>
          )}

          {/* Step 3: Resumen */}
          {step === 3 && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Revise los datos antes de enviar</Typography>
              </Grid>
              <Grid item xs={12} md={6}><strong>Apellido:</strong> {form.apellido}</Grid>
              <Grid item xs={12} md={6}><strong>Nombre:</strong> {form.nombre}</Grid>
              <Grid item xs={12} md={6}><strong>DNI / Pasaporte:</strong> {form.dni}</Grid>
              <Grid item xs={12} md={6}><strong>Correo:</strong> {form.email}</Grid>
              <Grid item xs={12}><strong>Carrera / Cohorte:</strong> {form.career} / {form.cohort}</Grid>
              <Grid item xs={12}><strong>Título:</strong> {form.degreeTitle}</Grid>
              <Grid item xs={12}><strong>Motivaciones:</strong> {form.motivations}</Grid>
              <Grid item xs={12}><strong>Archivos subidos:</strong> {(form.files || []).map(f => f.name).join(', ') || 'Ninguno'}</Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Button variant="outlined" onClick={() => { saveDraft(form, step); notify('Borrador guardado', 'info') }}>Guardar información</Button>
                  <Button variant="contained" color="primary" onClick={handleSubmit}>Enviar preinscripción</Button>
                </Box>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button type="button" variant="outlined" disabled={step === 0} onClick={handleBack}>Anterior</Button>
              {step < steps.length - 1 ? (
                <Button type="button" variant="contained" onClick={handleNext}>Continuar al Paso {step + 2}</Button>
              ) : (
                // On final step we render the action buttons inside the summary block;
                // leave this area empty to avoid accidental form submits
                <span />
              )}
            </Box>
          </Grid>

        </Grid>
      </div>
    </Paper>
  )
}
