import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { FileSystemOperation, FileSystemResponse } from '@/types/types';
import { logger } from '@/utils/logger';

const WORKSPACE_PATH = process.cwd();

interface FileSystemError extends Error {
  code?: string;
  path?: string;
}

function resolvePath(path: string): string {
  const resolved = join(WORKSPACE_PATH, path);
  logger.debug(`Resolved path: ${path} -> ${resolved}`, 'file');
  return resolved;
}

function ensureDirectoryExists(path: string): void {
  const dir = dirname(path);
  logger.debug(`Checking directory existence: ${dir}`, 'file');
  
  if (!existsSync(dir)) {
    logger.info(`Directory does not exist: ${dir}`, 'file');
    try {
      mkdirSync(dir, { recursive: true });
      logger.success(`Created directory structure: ${dir}`, 'file');
    } catch (error: unknown) {
      const fsError = error as FileSystemError;
      logger.error(`Failed to create directory: ${dir} - ${fsError.message}`, 'file');
      throw error;
    }
  } else {
    logger.debug(`Directory already exists: ${dir}`, 'file');
  }
}

export async function POST(req: Request) {
  logger.info('Received file system operation request', 'file');
  
  try {
    const operation: FileSystemOperation = await req.json();
    logger.tool('file_system_operation', {
      ...operation,
      timestamp: new Date().toISOString(),
      workspace: WORKSPACE_PATH
    });
    
    const fullPath = resolvePath(operation.path);
    let response: FileSystemResponse;

    // Pre-operation validation
    logger.debug(`Validating operation: ${operation.type} on ${operation.path}`, 'file');
    if (!operation.path) {
      logger.error('Invalid operation: path is required', 'file');
      throw new Error('Path is required');
    }

    switch (operation.type) {
      case 'create':
        logger.info(`Attempting to create file: ${operation.path}`, 'file');
        if (existsSync(fullPath)) {
          if (operation.metadata?.overwrite) {
            logger.warn(`File exists, overwriting: ${operation.path}`, 'file');
          } else {
            logger.warn(`File creation blocked - already exists: ${operation.path}`, 'file');
            response = {
              success: false,
              message: `File ${operation.path} already exists. Set overwrite: true to override.`,
              path: operation.path,
              error: 'FILE_EXISTS'
            };
            break;
          }
        }
        
        try {
          ensureDirectoryExists(fullPath);
          writeFileSync(fullPath, operation.content || '');
          logger.file('CREATE', operation.path, true);
          logger.debug(`File content written successfully: ${operation.path} (${Buffer.from(operation.content || '').length} bytes)`, 'file');
          response = {
            success: true,
            message: `Created file ${operation.path}`,
            path: operation.path
          };
        } catch (error: unknown) {
          const fsError = error as FileSystemError;
          logger.error(`Failed to create file: ${operation.path} - ${fsError.message}`, 'file');
          throw error;
        }
        break;

      case 'edit':
        logger.info(`Attempting to edit file: ${operation.path}`, 'file');
        if (!existsSync(fullPath)) {
          logger.error(`Edit failed - file not found: ${operation.path}`, 'file');
          response = {
            success: false,
            message: `File ${operation.path} does not exist`,
            path: operation.path,
            error: 'FILE_NOT_FOUND'
          };
        } else {
          try {
            const originalContent = readFileSync(fullPath, 'utf8');
            writeFileSync(fullPath, operation.content || '');
            logger.file('EDIT', operation.path, true);
            logger.debug(`File edited successfully: ${operation.path} (${Buffer.from(originalContent).length} -> ${Buffer.from(operation.content || '').length} bytes)`, 'file');
            response = {
              success: true,
              message: `Updated file ${operation.path}`,
              path: operation.path
            };
          } catch (error: unknown) {
            const fsError = error as FileSystemError;
            logger.error(`Failed to edit file: ${operation.path} - ${fsError.message}`, 'file');
            throw error;
          }
        }
        break;

      case 'delete':
        logger.info(`Attempting to delete file: ${operation.path}`, 'file');
        if (!existsSync(fullPath)) {
          logger.error(`Delete failed - file not found: ${operation.path}`, 'file');
          response = {
            success: false,
            message: `File ${operation.path} does not exist`,
            path: operation.path,
            error: 'FILE_NOT_FOUND'
          };
        } else {
          try {
            const stats = statSync(fullPath);
            unlinkSync(fullPath);
            logger.file('DELETE', operation.path, true);
            logger.debug(`File deleted successfully: ${operation.path} (was ${stats.size} bytes)`, 'file');
            response = {
              success: true,
              message: `Deleted file ${operation.path}`,
              path: operation.path
            };
          } catch (error: unknown) {
            const fsError = error as FileSystemError;
            logger.error(`Failed to delete file: ${operation.path} - ${fsError.message}`, 'file');
            throw error;
          }
        }
        break;

      case 'mkdir':
        logger.info(`Attempting to create directory: ${operation.path}`, 'file');
        try {
          mkdirSync(fullPath, { recursive: true });
          logger.file('MKDIR', operation.path, true);
          logger.debug(`Directory created successfully: ${operation.path}`, 'file');
          response = {
            success: true,
            message: `Created directory ${operation.path}`,
            path: operation.path
          };
        } catch (error: unknown) {
          const fsError = error as FileSystemError;
          logger.error(`Failed to create directory: ${operation.path} - ${fsError.message}`, 'file');
          throw error;
        }
        break;

      default:
        logger.error(`Invalid operation type: ${(operation as any).type}`, 'file');
        response = {
          success: false,
          message: `Unknown operation type: ${(operation as any).type}`,
          error: 'INVALID_OPERATION'
        };
    }

    logger.debug(`Operation completed: ${operation.type} on ${operation.path}`, 'file');
    return NextResponse.json(response);
  } catch (error: unknown) {
    const fsError = error as FileSystemError;
    logger.error(`Operation failed: ${fsError.message}`, 'file');
    logger.debug(`Error stack trace: ${fsError.stack}`, 'file');
    return NextResponse.json({
      success: false,
      message: `Operation failed: ${fsError.message}`,
      error: 'OPERATION_FAILED',
      details: fsError.stack
    }, { status: 500 });
  }
} 