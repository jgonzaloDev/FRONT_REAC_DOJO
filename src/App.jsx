import React from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { LoginPageExtra as LoginExtra, LoginPage, Button } from 'storybook-dojo-react'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'

function LoginWrapper() {
  const navigate = useNavigate()

  const handleLogin = (creds) => {
    // simple fake auth: store user in sessionStorage
    sessionStorage.setItem('user', JSON.stringify({ user: creds.user }))
    navigate('/dashboard')
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <LoginPage sideStart="#ca4095ff" tittle="1"
        sideEnd="#adc741ff" onLogin={handleLogin} text="Iniciar sesión" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </BrowserRouter>
  )
}
