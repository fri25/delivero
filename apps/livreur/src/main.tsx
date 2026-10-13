import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import { queryClient } from './lib/query-client'
import { restaurerCache, sauvegarderCache } from './lib/cache-persistant'

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
