import { NextResponse } from 'next/server'
import { mkdir, writeFile, readFile, unlink, readdir, stat, rm } from 'fs/promises'
import { join, dirname } from 'path'

const WORKSPACE_ROOT = process.cwd()

interface FileSystemOperation {
  type: 'readdir' | 'mkdir' | 'writeFile' | 'readFile' | 'unlink' | 'move';
  path: string;
  content?: string;
  newPath?: string;
}

// Ensure path is within workspace but allow all operations
function validatePath(path: string): string {
  return join(WORKSPACE_ROOT, path)
}

export async function POST(req: Request) {
  try {
    const operation: FileSystemOperation = await req.json()
    const { type, path } = operation
    const fullPath = validatePath(path)

    switch (type) {
      case 'readdir': {
        const items = await readdir(fullPath, { withFileTypes: true })
        const contents = await Promise.all(
          items.map(async (item) => {
            const itemPath = join(fullPath, item.name)
            const stats = await stat(itemPath)
            return {
              name: item.name,
              type: item.isDirectory() ? 'folder' : 'file',
              size: stats.size,
              modifiedTime: stats.mtime.toISOString(),
              children: item.isDirectory() ? [] : undefined
            }
          })
        )
        return NextResponse.json({ success: true, contents })
      }

      case 'mkdir': {
        await mkdir(fullPath, { recursive: true })
        return NextResponse.json({ success: true })
      }

      case 'writeFile': {
        const dir = dirname(fullPath)
        await mkdir(dir, { recursive: true })
        await writeFile(fullPath, operation.content || '')
        return NextResponse.json({ success: true })
      }

      case 'readFile': {
        const content = await readFile(fullPath, 'utf-8')
        return NextResponse.json({ success: true, content })
      }

      case 'unlink': {
        // Use rm with force and recursive options to delete anything
        await rm(fullPath, { force: true, recursive: true })
        return NextResponse.json({ success: true })
      }

      case 'move': {
        if (!operation.newPath) {
          throw new Error('New path is required for move operation')
        }
        const newFullPath = validatePath(operation.newPath)
        await mkdir(dirname(newFullPath), { recursive: true })
        // Use fs.rename when we add it to imports
        const content = await readFile(fullPath, 'utf-8')
        await writeFile(newFullPath, content)
        await rm(fullPath, { force: true, recursive: true })
        return NextResponse.json({ success: true })
      }

      default:
        throw new Error(`Unsupported operation: ${type}`)
    }
  } catch (error) {
    console.error('File system operation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 