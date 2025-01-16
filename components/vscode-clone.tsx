'use client'

import { useState } from 'react'
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { FileIcon, FolderIcon, TerminalIcon, Settings2Icon, ChevronRightIcon, SaveIcon, PlayIcon } from 'lucide-react'

type File = {
  name: string
  content: string
  language: string
}

type Folder = {
  name: string
  children: (File | Folder)[]
}

const initialFiles: (File | Folder)[] = [
  {
    name: 'src',
    children: [
      { name: 'App.tsx', content: 'function App() {\n  return <div>Hello World</div>\n}\n\nexport default App', language: 'typescript' },
      { name: 'index.tsx', content: "import React from 'react'\nimport ReactDOM from 'react-dom'\nimport App from './App'\n\nReactDOM.render(<App />, document.getElementById('root'))", language: 'typescript' },
    ]
  },
  { name: 'package.json', content: '{\n  "name": "my-project",\n  "version": "1.0.0"\n}', language: 'json' },
  { name: 'README.md', content: '# My Project\n\nThis is a sample project.', language: 'markdown' },
]

export default function VSCodeClone() {
  const [files, setFiles] = useState<(File | Folder)[]>(initialFiles)
  const [activeFile, setActiveFile] = useState<File | null>(null)
  const [terminalContent, setTerminalContent] = useState<string>('')

  const handleFileClick = (file: File) => {
    setActiveFile(file)
  }

  const handleContentChange = (content: string) => {
    if (activeFile) {
      const updatedFiles = updateFileContent(files, activeFile.name, content)
      setFiles(updatedFiles)
      setActiveFile({ ...activeFile, content })
    }
  }

  const handleSave = () => {
    // In a real IDE, this would save the file to disk
    console.log('Saving file:', activeFile?.name)
  }

  const handleRun = () => {
    // In a real IDE, this would run the code
    setTerminalContent(`Running ${activeFile?.name}...\n> Hello, World!`)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <SidebarProvider>
        <Sidebar className="w-64 border-r">
          <SidebarHeader className="h-14 px-4 flex items-center justify-between border-b">
            <span className="font-semibold">Explorer</span>
            <Button variant="ghost" size="icon">
              <Settings2Icon className="h-4 w-4" />
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-[calc(100vh-3.5rem)] px-2">
              <FileTree files={files} onFileClick={handleFileClick} />
            </ScrollArea>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-hidden">
          {activeFile ? (
            <Tabs defaultValue="editor" className="h-full flex flex-col">
              <div className="flex items-center justify-between h-14 px-4 border-b">
                <TabsList>
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={handleSave}>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" onClick={handleRun}>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Run
                  </Button>
                </div>
              </div>
              <TabsContent value="editor" className="flex-1 p-4">
                <Editor
                  content={activeFile.content}
                  language={activeFile.language}
                  onChange={handleContentChange}
                />
              </TabsContent>
              <TabsContent value="preview" className="flex-1 p-4">
                <Preview content={activeFile.content} language={activeFile.language} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a file to edit
            </div>
          )}
        </div>
        <Separator />
        <div className="h-64 border-t">
          <Terminal content={terminalContent} />
        </div>
      </div>
    </div>
  )
}

function FileTree({ files, onFileClick, level = 0 }: { files: (File | Folder)[], onFileClick: (file: File) => void, level?: number }) {
  return (
    <div className={`space-y-1 ${level > 0 ? 'ml-4' : ''}`}>
      {files.map((item, index) => (
        <div key={index}>
          {'children' in item ? (
            <Folder folder={item} onFileClick={onFileClick} level={level} />
          ) : (
            <div
              className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-muted cursor-pointer"
              onClick={() => onFileClick(item)}
            >
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{item.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Folder({ folder, onFileClick, level }: { folder: Folder, onFileClick: (file: File) => void, level: number }) {
  const [isOpen, setIsOpen] = useState(level === 0)

  return (
    <div>
      <div
        className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-muted cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronRightIcon className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-90' : ''}`} />
        <FolderIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{folder.name}</span>
      </div>
      {isOpen && <FileTree files={folder.children} onFileClick={onFileClick} level={level + 1} />}
    </div>
  )
}

function Editor({ content, language, onChange }: { content: string, language: string, onChange: (content: string) => void }) {
  return (
    <Textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-full font-mono text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
      style={{ minHeight: 'calc(100vh - 12rem)' }}
    />
  )
}

function Preview({ content, language }: { content: string, language: string }) {
  if (language === 'markdown') {
    return <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
  }
  return <pre className="text-sm">{content}</pre>
}

function Terminal({ content }: { content: string }) {
  return (
    <div className="h-full bg-muted p-4">
      <div className="flex items-center space-x-2 mb-2">
        <TerminalIcon className="h-4 w-4" />
        <span className="font-semibold">Terminal</span>
      </div>
      <ScrollArea className="h-[calc(100%-2rem)]">
        <pre className="text-sm font-mono">{content}</pre>
      </ScrollArea>
    </div>
  )
}

function updateFileContent(files: (File | Folder)[], fileName: string, newContent: string): (File | Folder)[] {
  return files.map(item => {
    if ('children' in item) {
      return {
        ...item,
        children: updateFileContent(item.children, fileName, newContent)
      }
    }
    if (item.name === fileName) {
      return { ...item, content: newContent }
    }
    return item
  })
}

