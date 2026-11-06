import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { activerManifeste, chargerEntreprise } from '@delivero/config/entreprise'

import { router } from './router'

// Name, colours and features of the company (étape 6); cached value until then.
activerManifeste(import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api', 'admin')
void chargerEntreprise(import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api')

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
