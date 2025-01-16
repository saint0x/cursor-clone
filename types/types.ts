// Tool Definitions
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameter>;
      required: string[];
      additionalProperties: false;
    };
    strict: true;
  };
}

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: {
    type: string;
    description?: string;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string of arguments
  };
}

// File System Operations
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

// Code Editor Operations
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

// Workspace Context
export interface WorkspaceContext {
  workspacePath: string;
  files: string[];
  directories: string[];
  openFiles: string[];
  currentFile?: string;
  selection?: {
    file: string;
    startLine: number;
    endLine: number;
  };
}

// AI Response Types
export interface AIResponse {
  message: string;
  operations?: FileSystemOperation[];
  edits?: CodeEdit[];
}

// AI Thought Process Types
export interface AIThoughtProcess {
  thoughts: {
    reasoning: string;
    plan: string[];
    criticism: string;
    shouldShowCode: boolean;
  };
  
  codeAnalysis: {
    language: string;
    dependencies?: string[];
    potentialIssues?: string[];
    suggestedFileName?: string;
    isComplete: boolean;
  };
  
  fileOperations?: {
    type: 'create' | 'edit' | 'delete';
    path: string;
    content?: string;
    reason: string;
  }[];
  
  response: {
    message: string;
    codeBlocks?: {
      language: string;
      code: string;
      fileName?: string;
      description?: string;
    }[];
    shouldShowAcceptDeny: boolean;
  };
}

// Updated AI Response type to include thought process
export interface EnhancedAIResponse extends AIResponse {
  thoughtProcess?: AIThoughtProcess;
}

// Example thought process for the system prompt
export const EXAMPLE_THOUGHT_PROCESS: AIThoughtProcess = {
  thoughts: {
    reasoning: "User wants a simple Python script that prints numbers 1-5. This is a basic loop operation.",
    plan: [
      "1. Create a for loop using range()",
      "2. Use print() for output",
      "3. Suggest descriptive filename"
    ],
    criticism: "Very basic implementation, could add error handling or user input for range",
    shouldShowCode: true
  },
  
  codeAnalysis: {
    language: "python",
    dependencies: [],
    potentialIssues: [],
    suggestedFileName: "number_printer.py",
    isComplete: true
  },
  
  fileOperations: [
    {
      type: "create",
      path: "number_printer.py",
      content: "for i in range(1, 6):\n    print(i)",
      reason: "Creating new Python script as requested"
    }
  ],
  
  response: {
    message: "I've written a simple Python script that prints numbers from 1 to 5:",
    codeBlocks: [
      {
        language: "python",
        code: "for i in range(1, 6):\n    print(i)",
        fileName: "number_printer.py",
        description: "Prints numbers 1 through 5"
      }
    ],
    shouldShowAcceptDeny: true
  }
};

// Tool Definitions for LLM
export const FILE_SYSTEM_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'file_system_operation',
    description: 'Perform file system operations like creating, editing, or deleting files and directories',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'The type of operation to perform',
          enum: ['create', 'edit', 'delete', 'mkdir']
        },
        path: {
          type: 'string',
          description: 'The path to the file or directory, relative to workspace root'
        },
        content: {
          type: 'string',
          description: 'The content to write to the file (for create/edit operations)'
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata about the operation',
          properties: {
            fileType: { type: 'string' },
            description: { type: 'string' },
            requires: { 
              type: 'array',
              items: { type: 'string' }
            },
            overwrite: { type: 'boolean' }
          }
        }
      },
      required: ['type', 'path'],
      additionalProperties: false
    },
    strict: true
  }
};

export const CODE_EDIT_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'code_edit',
    description: 'Perform precise line-level edits to code files',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'The type of edit to perform',
          enum: ['insert', 'replace', 'delete']
        },
        path: {
          type: 'string',
          description: 'The path to the file to edit'
        },
        startLine: {
          type: 'number',
          description: 'The line number to start editing at (1-based)'
        },
        endLine: {
          type: 'number',
          description: 'The line number to end editing at (1-based, inclusive)'
        },
        content: {
          type: 'string',
          description: 'The content to insert or replace with'
        },
        description: {
          type: 'string',
          description: 'A description of what this edit does'
        }
      },
      required: ['type', 'path', 'startLine', 'description'],
      additionalProperties: false
    },
    strict: true
  }
};

// Example tool call responses the LLM should emit
export const EXAMPLE_TOOL_CALLS = {
  fileSystem: {
    id: 'fs_call_1',
    type: 'function',
    function: {
      name: 'file_system_operation',
      arguments: JSON.stringify({
        type: 'create',
        path: 'src/utils/helper.ts',
        content: 'export function helper() {}',
        metadata: {
          fileType: 'typescript',
          description: 'Helper utility function',
          requires: []
        }
      })
    }
  },
  codeEdit: {
    id: 'edit_call_1',
    type: 'function',
    function: {
      name: 'code_edit',
      arguments: JSON.stringify({
        type: 'insert',
        path: 'src/utils/helper.ts',
        startLine: 1,
        content: 'import { Something } from "./something";',
        description: 'Add import statement'
      })
    }
  }
}; 