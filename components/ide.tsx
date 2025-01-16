'use client'

import { useState, useCallback, useEffect } from 'react'
import { FileExplorer } from './file-explorer'
import { Editor } from './editor'
import { Terminal } from './terminal'
import { TopBar } from './top-bar'
import { StatusBar } from './status-bar'
import { RightPanel } from './right-panel'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

interface FileSystemItem {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileSystemItem[];
  size?: number;
  modifiedTime?: string;
}

async function fetchFileSystem(path: string = ''): Promise<FileSystemItem[]> {
  const response = await fetch('/api/filesystem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'readdir', path })
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error)
  return data.contents
}

export function IDE() {
  const { toast } = useToast()
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true)
  const [isTerminalOpen, setIsTerminalOpen] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [activeFileContent, setActiveFileContent] = useState<string>('')
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load initial file system
  useEffect(() => {
    fetchFileSystem()
      .then(setFileSystem)
      .catch(error => {
        console.error('Failed to load file system:', error)
        toast({
          title: 'Error',
          description: 'Failed to load file system',
          variant: 'destructive'
        })
      })
      .finally(() => setIsLoading(false))
  }, [toast])

  const refreshFileSystem = useCallback(async () => {
    try {
      const contents = await fetchFileSystem()
      setFileSystem(contents)
    } catch (error) {
      console.error('Failed to refresh file system:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh file system',
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleSelectFile = useCallback(async (path: string) => {
    try {
      const response = await fetch('/api/filesystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'readFile', path })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setActiveFile(path)
      setActiveFileContent(data.content)
    } catch (error) {
      console.error('Failed to read file:', error)
      toast({
        title: 'Error',
        description: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleCreateFile = useCallback(async (path: string, content: string) => {
    try {
      const response = await fetch('/api/filesystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'writeFile', path, content })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      await refreshFileSystem()
      toast({
        title: 'Success',
        description: `Created file: ${path}`
      })
    } catch (error) {
      console.error('Failed to create file:', error)
      toast({
        title: 'Error',
        description: `Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    }
  }, [refreshFileSystem, toast])

  const handleCreateFolder = useCallback(async (path: string) => {
    try {
      const response = await fetch('/api/filesystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mkdir', path })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      await refreshFileSystem()
      toast({
        title: 'Success',
        description: `Created folder: ${path}`
      })
    } catch (error) {
      console.error('Failed to create folder:', error)
      toast({
        title: 'Error',
        description: `Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    }
  }, [refreshFileSystem, toast])

  const handleDeleteItem = useCallback(async (path: string) => {
    try {
      const response = await fetch('/api/filesystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'unlink', path })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      if (activeFile === path) {
        setActiveFile(null)
      }
      await refreshFileSystem()
      toast({
        title: 'Success',
        description: `Deleted: ${path}`
      })
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast({
        title: 'Error',
        description: `Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    }
  }, [activeFile, refreshFileSystem, toast])

  const handleMoveItem = useCallback(async (oldPath: string, newPath: string) => {
    try {
      const response = await fetch('/api/filesystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'move', path: oldPath, newPath })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      if (activeFile === oldPath) {
        setActiveFile(newPath)
      }
      await refreshFileSystem()
      toast({
        title: 'Success',
        description: `Moved: ${oldPath} to ${newPath}`
      })
    } catch (error) {
      console.error('Failed to move item:', error)
      toast({
        title: 'Error',
        description: `Failed to move item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    }
  }, [activeFile, refreshFileSystem, toast])

  const handleUploadFiles = useCallback(async (files: FileList, targetPath: string) => {
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader()
        reader.onload = async () => {
          const content = reader.result as string
          const path = targetPath ? `${targetPath}/${file.name}` : file.name
          await handleCreateFile(path, content)
        }
        reader.readAsText(file)
      }
    } catch (error) {
      console.error('Failed to upload files:', error)
      toast({
        title: 'Error',
        description: `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    }
  }, [handleCreateFile, toast])

  const handleEditFile = useCallback(async (path: string, content: string) => {
    try {
      const response = await fetch('/api/filesystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'writeFile', path, content })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      if (path === activeFile) {
        setActiveFileContent(content)
      }
      await refreshFileSystem()
      toast({
        title: 'Success',
        description: `Updated file: ${path}`
      })
    } catch (error) {
      console.error('Failed to edit file:', error)
      toast({
        title: 'Error',
        description: `Failed to edit file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    }
  }, [refreshFileSystem, activeFile, toast])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TopBar 
        onToggleFileExplorer={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />
      <div className="flex-1 flex overflow-hidden">
        {isFileExplorerOpen && (
          <FileExplorer 
            files={fileSystem}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeleteItem={handleDeleteItem}
            onMoveItem={handleMoveItem}
            onUploadFiles={handleUploadFiles}
          />
        )}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className={cn("flex-1 overflow-auto", isTerminalOpen ? "h-[calc(100%-288px)]" : "h-full")}>
            <Editor 
              files={fileSystem}
              activeFile={activeFile}
              activeFileContent={activeFileContent}
              onEditFile={handleEditFile}
            />
          </div>
          {isTerminalOpen && <Terminal />}
        </div>
        {isChatOpen && (
          <RightPanel 
            isOpen={true}
            onClose={() => setIsChatOpen(false)}
            files={fileSystem}
            onEditFile={handleEditFile}
            onCreateFile={handleCreateFile}
            onDeleteItem={handleDeleteItem}
          />
        )}
      </div>
      <StatusBar />
      <Toaster />
    </div>
  )
}

