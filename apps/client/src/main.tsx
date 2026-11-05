import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { chargerEntreprise } from '@delivero/config/entreprise'
import { queryClient } from './lib/query-client'
import { router } from './router'
import { AppErrorBoundary } from './components/layout/AppErrorBoundary'

// Name, colours and features of the company (étape 6); cached value until then.
void chargerEntreprise(import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary><RouterProvider router={router} /></AppErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
