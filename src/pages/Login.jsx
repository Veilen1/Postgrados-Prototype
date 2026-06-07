import React, { useState } from 'react'
import { Paper, Typography, TextField, Button, Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { useNotify } from '../components/NotificationProvider'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const { signIn } = useAuth()
  const { notify } = useNotify()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const u = await signIn(username, password)
    if (!u) {
      setError('Usuario o contraseña incorrectos')
      notify('Usuario o contraseña incorrectos', 'error')
      return
    }
    notify(`Bienvenido ${u.name || u.username}`, 'success')
    // redirect by role
    if (u.role === 'conduccion') navigate('/admin')
    else if (u.role === 'docente') navigate('/teacher')
    else if (u.role === 'estudiante') navigate(`/student/${u.studentId || ''}`)
    else navigate('/')
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6">Iniciar sesión</Typography>
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField fullWidth label="Usuario" sx={{ my: 1 }} value={username} onChange={e => setUsername(e.target.value)} inputProps={{ 'aria-label': 'Usuario' }} autoFocus />
        <TextField fullWidth label="Contraseña" type="password" sx={{ my: 1 }} value={password} onChange={e => setPassword(e.target.value)} inputProps={{ 'aria-label': 'Contraseña' }} />
        <Button variant="contained" type="submit" sx={{ mt: 2 }} aria-label="Iniciar sesión">Entrar</Button>
      </form>

      <Typography sx={{ mt: 3 }} variant="body2">Usuarios demo: admin/admin (conducción), docente/docente (docente), est1/est1 (estudiante)</Typography>
    </Paper>
  )
}
