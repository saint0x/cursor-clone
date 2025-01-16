import { FileSystemTools, FileSystemOperation } from '@/tools/fs';
import { CodeEditor, CodeEdit } from '@/tools/code-editor';
import { WorkspaceContext } from '@/prompts/system-prompt';

export interface AIResponse {
  message: string;
  operations?: FileSystemOperation[];
  edits?: CodeEdit[];
}

export class AIOperationsService {
  private fs: FileSystemTools;
  private editor: CodeEditor;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.fs = new FileSystemTools(workspacePath);
    this.editor = new CodeEditor(workspacePath);
  }

  public getWorkspaceContext(): WorkspaceContext {
    const structure = this.fs.getWorkspaceStructure();
    return {
      workspacePath: this.workspacePath,
      files: structure.files,
      directories: structure.directories,
      openFiles: [], // This would be populated from the IDE state
      currentFile: undefined, // This would be populated from the IDE state
    };
  }

  public async executeAIResponse(response: AIResponse): Promise<{
    success: boolean;
    message: string;
    operations: any[];
  }> {
    const results = {
      success: true,
      message: '',
      operations: [] as any[],
    };

    try {
      // Execute file system operations
      if (response.operations) {
        for (const operation of response.operations) {
          const result = await this.fs.executeOperation(operation);
          results.operations.push(result);
          if (!result.success) {
            results.success = false;
            results.message = `File operation failed: ${result.message}`;
            return results;
          }
        }
      }

      // Execute code edits
      if (response.edits) {
        const editResults = await this.editor.applyEdits(response.edits);
        results.operations.push(...editResults);
        const failed = editResults.find(r => !r.success);
        if (failed) {
          results.success = false;
          results.message = `Code edit failed: ${failed.message}`;
          return results;
        }
      }

      results.message = 'All operations completed successfully';
      return results;

    } catch (error) {
      results.success = false;
      results.message = `Operation failed: ${error.message}`;
      return results;
    }
  }

  public validateAIResponse(response: AIResponse): boolean {
    if (!response.message) return false;

    if (response.operations) {
      for (const op of response.operations) {
        if (!op.type || !op.path) return false;
        if (op.type === 'create' || op.type === 'edit') {
          if (!op.content) return false;
        }
      }
    }

    if (response.edits) {
      for (const edit of response.edits) {
        if (!edit.type || !edit.path || !edit.startLine) return false;
        if (edit.type !== 'delete' && !edit.content) return false;
      }
    }

    return true;
  }
} 