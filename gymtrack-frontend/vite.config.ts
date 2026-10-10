import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vite.dev/config/
//
// Modos de desarrollo:
//   npm run dev          → solo en esta PC (http://localhost:5173)
//   npm run dev:red      → también desde el celular en la misma WiFi (http://<IP-de-la-PC>:5173)
//   npm run dev:celular  → igual pero con HTTPS: hace falta para usar la cámara (escanear el QR)
//
// En desarrollo el frontend llama a /api/... y Vite lo reenvía al backend (proxy), así el celular
// no necesita conocer la IP del backend ni hay problemas de CORS.
// Mismas cabeceras de seguridad que en Vercel (vercel.json), para probarlas con `npm run preview`.
// Si cambia el dominio del backend en producción, actualizar connect-src en los dos lugares.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://cdn.jsdelivr.net; font-src 'self' data:; connect-src 'self' https://*.onrender.com; worker-src 'self' blob:; media-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
const CABECERAS_SEGURIDAD = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), payment=()',
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react(), ...(mode === 'celular' ? [basicSsl()] : [])],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router-dom'],
      alias: {
        react: path.resolve('./node_modules/react'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          // Pasa la IP real del celular al backend (límite de intentos por dispositivo)
          xfwd: true,
        },
      },
    },
    preview: {
      headers: CABECERAS_SEGURIDAD,
      proxy: { '/api': { target: backend, changeOrigin: true, xfwd: true } },
    },
    build: {
      // La página Ejercicios (solo staff) trae el catálogo completo de 1.324 ejercicios (~1,1 MB).
      // El resto de la app usa un índice liviano de imágenes (imagenesEjercicios.json).
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          // Separa las librerías del código de la app (mejor caché en el celular)
          manualChunks: (id: string) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
            // Las librerías de QR quedan dentro de las pantallas que las usan (no se bajan al abrir la app)
            return undefined
          },
        },
      },
    },
  }
})
