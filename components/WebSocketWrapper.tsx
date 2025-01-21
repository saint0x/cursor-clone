'use client'

import { WebSocketProvider } from 'next-ws/client'

export function WebSocketWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WebSocketProvider url={`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}/api/terminal`}>
      {children}
    </WebSocketProvider>
  )
} 