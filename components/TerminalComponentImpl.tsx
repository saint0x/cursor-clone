'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWebSocket } from 'next-ws/client'
import '@xterm/xterm/css/xterm.css'

import type { Terminal } from '@xterm/xterm'
import type { FitAddon } from '@xterm/addon-fit'
import type { ITerminalOptions } from '@xterm/xterm'

export const TerminalComponentImpl = () => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)
  const ws = useWebSocket()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize terminal
  useEffect(() => {
    let mounted = true
    console.log('Starting terminal initialization')

    const initTerminal = async () => {
      try {
        if (!terminalRef.current || !mounted) {
          console.log('Terminal ref not ready or component unmounted')
          return
        }

        // Debug terminal div dimensions
        const rect = terminalRef.current.getBoundingClientRect()
        console.log('Terminal div dimensions:', {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        })

        console.log('Loading xterm libraries')
        const [{ Terminal }, { FitAddon }] = await Promise.all([
          import('@xterm/xterm'),
          import('@xterm/addon-fit')
        ])
        
        if (!mounted) return

        console.log('Creating terminal instance')
        const options: ITerminalOptions = {
          cursorBlink: true,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: 14,
          lineHeight: 1.2,
          theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#d4d4d4',
            black: '#000000',
            red: '#cd3131',
            green: '#0dbc79',
            yellow: '#e5e510',
            blue: '#2472c8',
            magenta: '#bc3fbc',
            cyan: '#11a8cd',
            white: '#e5e5e5',
            brightBlack: '#666666',
            brightRed: '#f14c4c',
            brightGreen: '#23d18b',
            brightYellow: '#f5f543',
            brightBlue: '#3b8eea',
            brightMagenta: '#d670d6',
            brightCyan: '#29b8db',
            brightWhite: '#e5e5e5'
          },
          allowTransparency: true,
          scrollback: 10000,
          convertEol: true
        }

        const term = new Terminal(options)
        const fit = new FitAddon()
        
        if (!mounted) {
          term.dispose()
          return
        }

        terminalInstance.current = term
        fitAddon.current = fit
        
        console.log('Opening terminal')
        term.loadAddon(fit)

        // Force a layout before opening the terminal
        terminalRef.current.style.display = 'block'
        terminalRef.current.style.height = '100%'
        terminalRef.current.style.width = '100%'
        
        term.open(terminalRef.current)
        
        // Set up focus handling
        term.onSelectionChange(() => {
          term.focus()
        })

        terminalRef.current.addEventListener('click', () => {
          term.focus()
        })
        
        // Wait for next frame and fit
        requestAnimationFrame(() => {
          if (mounted && fit) {
            console.log('Fitting terminal')
            fit.fit()
            setIsLoading(false)
            console.log('Terminal initialization complete')
            term.focus()
          }
        })

      } catch (err) {
        console.error('Terminal initialization error:', err)
        if (mounted) {
          setError('Failed to initialize terminal')
        }
      }
    }

    // Try to initialize immediately
    initTerminal()

    return () => {
      mounted = false
      if (terminalInstance.current) {
        console.log('Cleaning up terminal')
        terminalInstance.current.dispose()
        terminalInstance.current = null
        fitAddon.current = null
      }
    }
  }, [])

  // Handle WebSocket connection
  useEffect(() => {
    if (!ws || !terminalInstance.current) return

    console.log('Setting up WebSocket handlers')
    
    const term = terminalInstance.current

    ws.onmessage = (event) => {
      term.write(event.data)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setError('Failed to connect to terminal server')
    }

    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Add carriage return for proper line handling
        if (data === '\r') {
          ws.send('\r\n')
        } else {
          ws.send(data)
        }
      }
    })

    return () => {
      ws.onmessage = null
      ws.onerror = null
    }
  }, [ws])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        if (fitAddon.current && terminalInstance.current) {
          fitAddon.current.fit()
          terminalInstance.current.focus()
        }
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle tab focus
  const handleTabClick = () => {
    if (!isLoading && terminalInstance.current) {
      terminalInstance.current.focus()
    }
  }

  if (error) {
    return (
      <div className="h-72 border-t bg-background p-4 text-red-500">
        Terminal Error: {error}
      </div>
    )
  }

  return (
    <div className="h-72 border-t bg-background">
      <Tabs defaultValue="terminal" className="w-full">
        <TabsList className="bg-muted/50 p-0 h-10">
          <TabsTrigger value="problems" className="rounded-none px-4 h-10">PROBLEMS</TabsTrigger>
          <TabsTrigger value="terminal" className="rounded-none px-4 h-10" onClick={handleTabClick}>TERMINAL</TabsTrigger>
          <TabsTrigger value="output" className="rounded-none px-4 h-10">OUTPUT</TabsTrigger>
        </TabsList>
      </Tabs>
      <ScrollArea className="h-[calc(100%-40px)]">
        <div 
          ref={terminalRef} 
          className="h-full w-full p-2"
          style={{ display: isLoading ? 'none' : 'block' }}
          onClick={() => terminalInstance.current?.focus()}
        />
      </ScrollArea>
      {isLoading && (
        <div className="h-72 border-t bg-background p-4">
          Loading terminal... {ws ? '(WebSocket Connected)' : '(Waiting for WebSocket)'}
        </div>
      )}
    </div>
  )
}
