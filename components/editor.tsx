import { MonacoEditor } from '@/components/ui/monaco-editor'
import { useCallback, useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'

interface EditorProps {
  files: FileSystemItem[];
  activeFile: string | null;
  activeFileContent: string;
  onEditFile: (path: string, content: string) => void;
}

export function Editor({ files, activeFile, activeFileContent, onEditFile }: EditorProps) {
  const [localContent, setLocalContent] = useState(activeFileContent)
  
  // Update local content when active file changes
  useEffect(() => {
    setLocalContent(activeFileContent)
  }, [activeFileContent, activeFile])

  // Debounce save changes to prevent too many API calls
  const debouncedSave = useDebouncedCallback((content: string) => {
    if (activeFile) {
      onEditFile(activeFile, content)
    }
  }, 500)

  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setLocalContent(value)
      debouncedSave(value)
    }
  }, [debouncedSave])

  if (!activeFile) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        Select a file to edit
      </div>
    )
  }

  const extension = activeFile.split('.').pop()?.toLowerCase() || ''
  const language = getLanguageFromExtension(extension)

  return (
    <div className="h-full w-full flex flex-col">
      <div className="h-12 min-h-[48px] border-b flex items-center px-4 bg-background">
        <span className="text-sm font-medium">{activeFile}</span>
      </div>
      <div className="flex-1 relative min-h-0">
        <MonacoEditor
          height="100%"
          width="100%"
          language={language}
          theme="vs-dark"
          value={localContent}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            renderWhitespace: 'none',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            fixedOverflowWidgets: true
          }}
        />
      </div>
    </div>
  )
}

function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'txt': 'plaintext'
  }
  return languageMap[extension] || 'plaintext'
}

