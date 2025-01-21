import { WebSocketServer, WebSocket } from 'ws'
import { Shell } from '../../../tools/shell'
import { spawn } from 'node:child_process'
import { platform } from 'node:process'
import { homedir } from 'os'

interface ResizeMessage {
  type: 'resize';
  cols: number;
  rows: number;
}

export function createWebSocketServer() {
  const wss = new WebSocketServer({ 
    noServer: true,
    perMessageDeflate: false, // Disable compression for better performance
    skipUTF8Validation: true, // Skip UTF-8 validation for better performance
  })

  wss.on('connection', (ws: WebSocket) => {
    console.log('New terminal connection established')
    let isAlive = true

    // Start a shell process
    const shell = platform === 'win32' ? 'cmd.exe' : '/bin/zsh'
    const shellProcess = spawn(shell, [], {
      cwd: homedir(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    })

    // Configure binary type
    ws.binaryType = 'arraybuffer'

    // Setup ping-pong to detect stale connections
    const pingInterval = setInterval(() => {
      if (!isAlive) {
        console.log('Terminal connection terminated due to inactivity')
        ws.terminate()
        return
      }
      isAlive = false
      ws.ping()
    }, 30000)

    ws.on('pong', () => {
      isAlive = true
    })

    // Handle shell output
    shellProcess.stdout.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString())
      }
    })

    shellProcess.stderr.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString())
      }
    })

    // Handle terminal input
    ws.on('message', (message: Buffer) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return
      }

      try {
        const data = message.toString()
        
        // Check if it's a resize message
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.type === 'resize') {
            // Resize not supported in basic shell mode
            return;
          }
        } catch {
          // Not JSON, treat as regular input
        }

        // Write to shell process
        shellProcess.stdin.write(data)
      } catch (error) {
        console.error('Error processing message:', error)
      }
    })

    // Handle connection close
    ws.on('close', () => {
      console.log('Terminal connection closed')
      clearInterval(pingInterval)
      shellProcess.kill()
    })

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      ws.terminate()
      shellProcess.kill()
    })

    // Send initial prompt
    shellProcess.stdin.write('\n')
  })

  return wss
}
