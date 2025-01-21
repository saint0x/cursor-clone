import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export class Shell {
  private currentDir: string
  private env: Record<string, string>

  constructor() {
    this.currentDir = process.cwd()
    this.env = Object.fromEntries(
      Object.entries(process.env)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, value as string])
    )
  }

  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath)
      const stats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file)
          const stat = await fs.stat(filePath)
          return { file, isDirectory: stat.isDirectory() }
        })
      )
      return stats.map(({ file, isDirectory }) => 
        isDirectory ? `${file}/` : file
      )
    } catch (error) {
      throw new Error(`ls: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async changeDirectory(newPath: string): Promise<void> {
    try {
      const resolvedPath = path.resolve(this.currentDir, newPath)
      await fs.access(resolvedPath)
      const stat = await fs.stat(resolvedPath)
      if (!stat.isDirectory()) {
        throw new Error(`cd: ${newPath}: Not a directory`)
      }
      this.currentDir = resolvedPath
    } catch (error) {
      throw new Error(`cd: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    try {
      const resolvedPath = path.resolve(this.currentDir, dirPath)
      await fs.mkdir(resolvedPath, { recursive: true })
    } catch (error) {
      throw new Error(`mkdir: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async createFile(filePath: string): Promise<void> {
    try {
      const resolvedPath = path.resolve(this.currentDir, filePath)
      await fs.writeFile(resolvedPath, '')
    } catch (error) {
      throw new Error(`touch: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      return await execAsync(command, {
        cwd: this.currentDir,
        env: {
          ...process.env,
          ...this.env
        }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Command failed: ${error.message}`)
      }
      throw new Error('Command failed with unknown error')
    }
  }

  getCurrentDirectory(): string {
    return this.currentDir
  }

  setEnvironmentVariable(key: string, value: string): void {
    this.env[key] = value
  }
}
