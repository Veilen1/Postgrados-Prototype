import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Container } from '@mui/material'
import NavBar from './components/NavBar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AspForm from './pages/AspForm'
import AdminDashboard from './pages/AdminDashboard'
import AdminStudents from './pages/AdminStudents'
import CohortPage from './pages/CohortPage'
import StudentProfile from './pages/StudentProfile'
import TeacherSheet from './pages/TeacherSheet'
import ProgramsPage from './pages/Programs'
import { useAuth } from './components/AuthProvider'

function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <div>
      <NavBar />
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/preinscripcion" element={<AspForm />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["conduccion"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={["conduccion"]}>
                <AdminStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/programs"
            element={
              <ProtectedRoute allowedRoles={["conduccion"]}>
                <ProgramsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cohort/:cohort"
            element={
              <ProtectedRoute allowedRoles={["conduccion","docente"]}>
                <CohortPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/:id"
            element={
              <ProtectedRoute allowedRoles={["conduccion","docente","estudiante"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["docente"]}>
                <TeacherSheet />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </div>
  )
}
