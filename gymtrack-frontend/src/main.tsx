import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import { MarcaProvider } from './shared/context/MarcaContext'
import './index.css'
import App from './App.tsx'
import LimiteErrores from './shared/components/LimiteErrores'
import './features/demo/demo.css'
import { ES_DEMO, bloquearWhatsApp } from './features/demo/demo'

if (ES_DEMO) bloquearWhatsApp()
createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <LimiteErrores completa>
 <BrowserRouter>
 <MarcaProvider>
 <AuthProvider>
 <App />
 </AuthProvider>
 </MarcaProvider>
 </BrowserRouter>
 </LimiteErrores>
 </StrictMode>,
)
