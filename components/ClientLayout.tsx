'use client'

import { WebSocketWrapper } from './WebSocketWrapper'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebSocketWrapper>
      {children}
    </WebSocketWrapper>
  )
} 