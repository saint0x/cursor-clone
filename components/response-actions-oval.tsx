'use client'

import { Check, X } from 'lucide-react'
import { useState } from 'react'

interface ResponseActionsOvalProps {
  onAccept: () => void
  onDeny: () => void
  className?: string
}

export function ResponseActionsOval({ onAccept, onDeny, className = "" }: ResponseActionsOvalProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div 
      className={`absolute top-2 right-2 flex items-center ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button
        className="relative flex items-center justify-between bg-zinc-800/50 border border-zinc-700 rounded-full h-8 px-1 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-zinc-800/80"
        style={{
          width: isHovering ? '64px' : '40px',
          padding: isHovering ? '0 4px' : '0 6px',
        }}
      >
        <span 
          className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
            isHovering ? 'bg-red-900/30 text-red-400 translate-x-0' : 'text-zinc-400 translate-x-0'
          }`}
          onClick={onDeny}
        >
          <X className="h-4 w-4" />
        </span>
        <span 
          className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
            isHovering ? 'bg-green-900/30 text-green-400 translate-x-0' : 'text-zinc-400 -translate-x-4'
          }`}
          onClick={onAccept}
        >
          <Check className="h-4 w-4" />
        </span>
      </button>
    </div>
  )
} 