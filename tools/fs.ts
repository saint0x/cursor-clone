import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'

export interface FileSystemOperation {
  type: 'create' | 'edit' | 'delete' | 'mkdir';
  path: string;
  content?: string;
  metadata?: {
    fileType?: string;
    description?: string;
    requires?: string[];
    overwrite?: boolean;
  };
}

export interface FileSystemResponse {
  success: boolean;
  message: string;
  path?: string;
  error?: string;
}

export class FileSystemTools {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  private resolvePath(path: string): string {
    return join(this.workspacePath, path);
  }

  private ensureDirectoryExists(path: string): void {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  public async executeOperation(operation: FileSystemOperation): Promise<FileSystemResponse> {
    const fullPath = this.resolvePath(operation.path);

    try {
      switch (operation.type) {
        case 'create':
          if (existsSync(fullPath) && !operation.metadata?.overwrite) {
            return {
              success: false,
              message: `File ${operation.path} already exists. Set overwrite: true to override.`,
              path: operation.path,
              error: 'FILE_EXISTS'
            };
          }
          this.ensureDirectoryExists(fullPath);
          writeFileSync(fullPath, operation.content || '');
          return {
            success: true,
            message: `Created file ${operation.path}`,
            path: operation.path
          };

        case 'edit':
          if (!existsSync(fullPath)) {
            return {
              success: false,
              message: `File ${operation.path} does not exist`,
              path: operation.path,
              error: 'FILE_NOT_FOUND'
            };
          }
          writeFileSync(fullPath, operation.content || '');
          return {
            success: true,
            message: `Updated file ${operation.path}`,
            path: operation.path
          };

        case 'delete':
          if (!existsSync(fullPath)) {
            return {
              success: false,
              message: `File ${operation.path} does not exist`,
              path: operation.path,
              error: 'FILE_NOT_FOUND'
            };
          }
          unlinkSync(fullPath);
          return {
            success: true,
            message: `Deleted file ${operation.path}`,
            path: operation.path
          };

        case 'mkdir':
          mkdirSync(fullPath, { recursive: true });
          return {
            success: true,
            message: `Created directory ${operation.path}`,
            path: operation.path
          };

        default:
          return {
            success: false,
            message: `Unknown operation type: ${(operation as any).type}`,
            error: 'INVALID_OPERATION'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Operation failed: ${error.message}`,
        path: operation.path,
        error: 'OPERATION_FAILED'
      };
    }
  }

  public getWorkspaceStructure(): { files: string[]; directories: string[] } {
    const structure = {
      files: [] as string[],
      directories: [] as string[]
    };

    const traverse = (dir: string) => {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const relativePath = fullPath.replace(this.workspacePath, '').slice(1);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules') {
            structure.directories.push(relativePath);
            traverse(fullPath);
          }
        } else {
          if (!item.startsWith('.')) {
            structure.files.push(relativePath);
          }
        }
      }
    };

    traverse(this.workspacePath);
    return structure;
  }

  public readFileContent(path: string): string | null {
    const fullPath = this.resolvePath(path);
    try {
      return readFileSync(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }
} 