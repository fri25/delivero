import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { activerManifeste, chargerEntreprise } from '@delivero/config/entreprise'
import { router } from './router'
import { queryClient } from './lib/query-client'

import { restaurerCache, sauvegarderCache } from './lib/cache-persistant'

// Name, colours and features of the company (étape 6); cached value until then.
activerManifeste(import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api', 'livreur')
void chargerEntreprise(import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api')

function afficher() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

// Last known lists first (offline start), then the live app.
void restaurerCache(queryClient)
  .catch(() => undefined)
  .finally(() => {
    sauvegarderCache(queryClient)
    afficher()
  })
