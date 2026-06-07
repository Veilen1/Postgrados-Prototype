import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { Button as MuiButton } from '@mui/material'

export default function NavBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    signOut()
    navigate('/')
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}>
          Posgrado - Demo
        </Typography>
        <Box>
          <MuiButton color="inherit" component={Link} to="/preinscripcion">Preinscripción</MuiButton>
          {!user && <MuiButton color="inherit" component={Link} to="/login">Login</MuiButton>}
          {user && user.role === 'conduccion' && <MuiButton color="inherit" component={Link} to="/admin">Panel</MuiButton>}
          {user && user.role === 'conduccion' && <MuiButton color="inherit" component={Link} to="/programs">Posgrados</MuiButton>}
          {user && user.role === 'docente' && <MuiButton color="inherit" component={Link} to="/teacher">Planilla</MuiButton>}
          {user && user.role === 'estudiante' && (
            <MuiButton color="inherit" component={Link} to={`/student/${user.studentId || ''}`}>Mi Perfil</MuiButton>
          )}
          {user && <MuiButton color="inherit" onClick={handleLogout}>Cerrar sesión</MuiButton>}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
