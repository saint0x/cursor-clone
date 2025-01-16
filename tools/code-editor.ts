import { FileSystemTools } from './fs';

export interface CodeEdit {
  type: 'insert' | 'replace' | 'delete';
  path: string;
  startLine: number;
  endLine?: number;
  content?: string;
  description: string;
}

export interface CodeEditResponse {
  success: boolean;
  message: string;
  path: string;
  edit?: CodeEdit;
  error?: string;
}

export class CodeEditor {
  private fs: FileSystemTools;

  constructor(workspacePath: string) {
    this.fs = new FileSystemTools(workspacePath);
  }

  private splitLines(content: string): string[] {
    return content.split(/\r?\n/);
  }

  private joinLines(lines: string[]): string {
    return lines.join('\n');
  }

  public async applyEdit(edit: CodeEdit): Promise<CodeEditResponse> {
    try {
      const content = this.fs.readFileContent(edit.path);
      if (!content) {
        return {
          success: false,
          message: `File ${edit.path} not found`,
          path: edit.path,
          error: 'FILE_NOT_FOUND'
        };
      }

      const lines = this.splitLines(content);
      const startIdx = edit.startLine - 1; // Convert to 0-based index
      const endIdx = edit.endLine ? edit.endLine - 1 : startIdx;

      if (startIdx < 0 || startIdx >= lines.length || endIdx >= lines.length) {
        return {
          success: false,
          message: `Invalid line numbers for file ${edit.path}`,
          path: edit.path,
          error: 'INVALID_LINE_NUMBERS'
        };
      }

      let newLines: string[];
      switch (edit.type) {
        case 'insert':
          newLines = [
            ...lines.slice(0, startIdx),
            edit.content || '',
            ...lines.slice(startIdx)
          ];
          break;

        case 'replace':
          newLines = [
            ...lines.slice(0, startIdx),
            edit.content || '',
            ...lines.slice(endIdx + 1)
          ];
          break;

        case 'delete':
          newLines = [
            ...lines.slice(0, startIdx),
            ...lines.slice(endIdx + 1)
          ];
          break;

        default:
          return {
            success: false,
            message: `Unknown edit type: ${(edit as any).type}`,
            path: edit.path,
            error: 'INVALID_EDIT_TYPE'
          };
      }

      const newContent = this.joinLines(newLines);
      await this.fs.executeOperation({
        type: 'edit',
        path: edit.path,
        content: newContent
      });

      return {
        success: true,
        message: `Successfully applied ${edit.type} edit to ${edit.path}`,
        path: edit.path,
        edit
      };
    } catch (error) {
      return {
        success: false,
        message: `Edit failed: ${error.message}`,
        path: edit.path,
        error: 'EDIT_FAILED'
      };
    }
  }

  public async applyEdits(edits: CodeEdit[]): Promise<CodeEditResponse[]> {
    const responses: CodeEditResponse[] = [];
    
    for (const edit of edits) {
      const response = await this.applyEdit(edit);
      responses.push(response);
      
      if (!response.success) {
        // Rollback previous successful edits
        for (let i = responses.length - 2; i >= 0; i--) {
          if (responses[i].success && responses[i].edit) {
            await this.revertEdit(responses[i].edit);
          }
        }
        break;
      }
    }
    
    return responses;
  }

  private async revertEdit(edit: CodeEdit): Promise<void> {
    const content = this.fs.readFileContent(edit.path);
    if (!content) return;

    const lines = this.splitLines(content);
    const startIdx = edit.startLine - 1;
    const endIdx = edit.endLine ? edit.endLine - 1 : startIdx;

    // Reverse the edit operation
    switch (edit.type) {
      case 'insert':
        lines.splice(startIdx, 1);
        break;
      case 'replace':
        lines.splice(startIdx, 1, ...this.splitLines(edit.content || ''));
        break;
      case 'delete':
        lines.splice(startIdx, 0, edit.content || '');
        break;
    }

    await this.fs.executeOperation({
      type: 'edit',
      path: edit.path,
      content: this.joinLines(lines)
    });
  }
} 