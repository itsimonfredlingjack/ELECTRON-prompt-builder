import type { ReactNode } from 'react'
import { ComposerProvider } from '@/contexts/composerContext'
import { GenerationProvider } from '@/contexts/generationContext'
import { OutputProvider } from '@/contexts/outputContext'
import { RuntimeProvider } from '@/contexts/runtimeContext'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <RuntimeProvider>
      <ComposerProvider>
        <OutputProvider>
          <GenerationProvider>{children}</GenerationProvider>
        </OutputProvider>
      </ComposerProvider>
    </RuntimeProvider>
  )
}
