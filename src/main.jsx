import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'
import 'storybook-dojo-react/dist/index.esm.css'
import './styles/overrides.css'
import Orders from './pages/Orders'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Orders />
  </React.StrictMode>
)
