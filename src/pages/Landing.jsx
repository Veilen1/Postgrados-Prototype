import React from 'react'
import { Paper, Typography, Button, Grid } from '@mui/material'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4">Sistema de Gestión de Posgrado - Demo</Typography>
          <Typography sx={{ mt: 2 }}>
            Esta es una demo con datos hardcodeados y persistencia en localStorage.
            Podés enviar el enlace de preinscripción a un aspirante.
          </Typography>
          <Button variant="contained" component={Link} to="/preinscripcion" sx={{ mt: 2 }}>Ir a Preinscripción</Button>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">¿Sos aspirante?</Typography>
          <Typography sx={{ mt: 1 }}>Completá el formulario de preinscripción y adjuntá la documentación solicitada.</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Equipo de conducción y docentes</Typography>
          <Typography sx={{ mt: 1 }}>Iniciá sesión para acceder al panel de gestión, listados y planillas.</Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}
