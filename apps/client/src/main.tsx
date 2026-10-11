import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { queryClient } from './lib/query-client'
import { router } from './router'
import { AppErrorBoundary } from './components/layout/AppErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary><RouterProvider router={router} /></AppErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
