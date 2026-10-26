import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import { MarcaProvider } from './shared/context/MarcaContext'
// Tipografías propias (servidas desde la app, sin depender de Google): Inter para el texto, Outfit (la de la marca) para títulos y números
import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/outfit/index.css'
import './index.css'
import App from './App.tsx'
import LimiteErrores from './shared/components/LimiteErrores'
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
