'use client'

import Editor, { EditorProps as MonacoEditorProps, OnMount } from '@monaco-editor/react'
import { useRef, useEffect } from 'react'
import type * as Monaco from 'monaco-editor'

interface EditorProps extends Partial<MonacoEditorProps> {
  value: string;
  onChange?: (value: string | undefined) => void;
}

export function MonacoEditor({ value, onChange, ...props }: EditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor
    editor.layout() // Force layout recalculation
  }

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== value) {
        editorRef.current.setValue(value)
        editorRef.current.layout() // Recalculate layout after value change
      }
    }
  }, [value])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="h-full w-full absolute inset-0">
      <Editor
        loading={
          <div className="h-full w-full flex items-center justify-center">
            Loading editor...
          </div>
        }
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        className="h-full w-full"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          renderWhitespace: 'none',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fixedOverflowWidgets: true,
          ...props.options,
        }}
        {...props}
      />
    </div>
  )
} 