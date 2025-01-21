import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { createWebSocketServer } from './wsServer';
import { NextResponse } from 'next/server';

export function SOCKET(
  client: WebSocket,
  request: IncomingMessage,
  server: WebSocketServer
) {
  const wsServer = createWebSocketServer();
  
  // Transfer the connection to our custom WebSocket server implementation
  wsServer.emit('connection', client, request);
}

// Add GET method to satisfy Next.js route requirements
export async function GET() {
  return NextResponse.json({ message: 'Terminal WebSocket endpoint' });
}

// Remove the GET handler as it's no longer needed with next-ws
