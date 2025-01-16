import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, File, Folder, Plus, Upload, MoreVertical } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface FileSystemItem {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileSystemItem[];
}

interface FileExplorerProps {
  files: FileSystemItem[];
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string, content: string) => void;
  onCreateFolder: (path: string) => void;
  onDeleteItem: (path: string) => void;
  onMoveItem: (oldPath: string, newPath: string) => void;
  onUploadFiles: (files: FileList, targetPath: string) => void;
}

export function FileExplorer({ 
  files, 
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteItem,
  onMoveItem,
  onUploadFiles
}: FileExplorerProps) {
  const { toast } = useToast()
  const [dragOverPath, setDragOverPath] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent, path: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPath(path)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPath(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetPath: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPath(null)

    // Handle files dropped from the system
    if (e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files, targetPath)
      return
    }

    // Handle internal drag and drop
    const draggedPath = e.dataTransfer.getData('text/plain')
    if (draggedPath && draggedPath !== targetPath) {
      onMoveItem(draggedPath, targetPath)
    }
  }, [onMoveItem, onUploadFiles])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, targetPath: string) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Clear the input value so the same folder can be selected again
    e.target.value = ''

    // Handle folder upload
    if (e.target.hasAttribute('webkitdirectory')) {
      const items = Array.from(files)
      
      // Check if we have valid folder items
      const hasValidItems = items.some(file => 'webkitRelativePath' in file && file.webkitRelativePath)
      if (!hasValidItems) {
        toast({
          title: 'Upload failed',
          description: 'No valid folder structure found. Please try again.',
          variant: 'destructive'
        })
        return
      }

      try {
        // Get root folder name from the first valid item
        const firstValidItem = items.find(file => file.webkitRelativePath)
        const rootPath = firstValidItem?.webkitRelativePath.split('/')[0] || 'uploaded-folder'
        
        // Group files by their directory structure
        const filesByPath = new Map<string, File[]>()
        items.forEach(file => {
          if (!file.webkitRelativePath) return

          const pathParts = file.webkitRelativePath.split('/')
          const path = pathParts.slice(0, -1).join('/')
          
          if (!filesByPath.has(path)) {
            filesByPath.set(path, [])
          }
          filesByPath.get(path)?.push(file)
        })

        // Create folders first, starting with root
        const paths = Array.from(filesByPath.keys())
        paths.sort((a, b) => a.split('/').length - b.split('/').length)
        
        // Create root folder if it doesn't exist in the path
        if (!paths.includes('')) {
          const fullRootPath = targetPath ? `${targetPath}/${rootPath}` : rootPath
          onCreateFolder(fullRootPath)
        }

        // Create subfolders
        paths.forEach(path => {
          if (path) {
            const fullPath = targetPath 
              ? `${targetPath}/${rootPath}/${path}` 
              : `${rootPath}/${path}`
            onCreateFolder(fullPath)
          }
        })

        // Then upload files
        let processedFiles = 0
        const totalFiles = items.length

        items.forEach(file => {
          if (!file.webkitRelativePath) return

          const reader = new FileReader()
          reader.onload = () => {
            const content = reader.result as string
            const fullPath = targetPath 
              ? `${targetPath}/${file.webkitRelativePath}` 
              : file.webkitRelativePath
            onCreateFile(fullPath, content)
            
            processedFiles++
            if (processedFiles === totalFiles) {
              toast({
                title: 'Upload complete',
                description: `Successfully uploaded ${totalFiles} files to ${rootPath}`
              })
            }
          }
          reader.onerror = () => {
            toast({
              title: 'Error',
              description: `Failed to read file: ${file.name}`,
              variant: 'destructive'
            })
          }
          reader.readAsText(file)
        })

        toast({
          title: 'Folder upload started',
          description: `Uploading ${totalFiles} files to ${rootPath}...`
        })
      } catch (error) {
        console.error('Folder upload error:', error)
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Failed to upload folder',
          variant: 'destructive'
        })
      }
    } else {
      // Handle regular file upload
      onUploadFiles(files, targetPath)
    }
  }, [onUploadFiles, onCreateFile, onCreateFolder, toast])

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-3 flex items-center justify-between border-b">
        <span className="text-sm font-medium">EXPLORER</span>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                Upload Files
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => folderInputRef.current?.click()}>
                Upload Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onCreateFolder('/')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          <FileTree
            items={files}
            parentPath=""
            onSelectFile={onSelectFile}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            onDeleteItem={onDeleteItem}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            dragOverPath={dragOverPath}
          />
        </div>
      </ScrollArea>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleFileUpload(e, '/')}
        multiple
      />
      <input
        type="file"
        ref={folderInputRef}
        className="hidden"
        onChange={(e) => handleFileUpload(e, '/')}
        // @ts-ignore - webkitdirectory is not in the types
        webkitdirectory=""
        directory=""
        multiple
      />
    </div>
  )
}

interface FileTreeProps {
  items: FileSystemItem[];
  parentPath: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string, content: string) => void;
  onCreateFolder: (path: string) => void;
  onDeleteItem: (path: string) => void;
  onDragOver: (e: React.DragEvent, path: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, path: string) => void;
  dragOverPath: string | null;
}

function FileTree({ 
  items,
  parentPath,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteItem,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverPath
}: FileTreeProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <FileTreeItem
          key={item.name}
          item={item}
          path={`${parentPath}/${item.name}`}
          onSelectFile={onSelectFile}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onDeleteItem={onDeleteItem}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          dragOverPath={dragOverPath}
        />
      ))}
    </div>
  )
}

interface FileTreeItemProps {
  item: FileSystemItem;
  path: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string, content: string) => void;
  onCreateFolder: (path: string) => void;
  onDeleteItem: (path: string) => void;
  onDragOver: (e: React.DragEvent, path: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, path: string) => void;
  dragOverPath: string | null;
}

function FileTreeItem({
  item,
  path,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteItem,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverPath
}: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isFolder = item.type === 'folder'

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', path)
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center group space-x-2 px-2 py-1 rounded-md cursor-pointer",
          dragOverPath === path && "bg-primary/10",
          !dragOverPath && "hover:bg-muted"
        )}
        draggable
        onDragStart={handleDragStart}
        onDragOver={(e) => onDragOver(e, path)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, path)}
        onClick={() => isFolder ? setIsOpen(!isOpen) : onSelectFile(path)}
      >
        {isFolder && (
          <ChevronRight 
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "transform rotate-90"
            )} 
          />
        )}
        {isFolder ? (
          <Folder className="h-4 w-4 text-blue-400" />
        ) : (
          <File className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex-1 text-sm">{item.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isFolder && (
              <>
                <DropdownMenuItem onClick={() => onCreateFile(`${path}/new-file.txt`, '')}>
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateFolder(`${path}/new-folder`)}>
                  New Folder
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem 
              onClick={() => onDeleteItem(path)}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isFolder && isOpen && item.children && (
        <div className="ml-4">
          <FileTree
            items={item.children}
            parentPath={path}
            onSelectFile={onSelectFile}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            onDeleteItem={onDeleteItem}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            dragOverPath={dragOverPath}
          />
        </div>
      )}
    </div>
  )
}

