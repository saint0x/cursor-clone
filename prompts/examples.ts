export const EXAMPLE_INTERACTIONS = `
Here are examples of how you can interact with the codebase:

1. Creating a new file:
{
  "message": "I've created a new utility function for date formatting.",
  "operations": [{
    "type": "create",
    "path": "src/utils/date-formatter.ts",
    "content": "export function formatDate(date: Date): string {\\n  return date.toLocaleDateString();\\n}",
    "metadata": {
      "fileType": "typescript",
      "description": "Utility function for date formatting",
      "requires": []
    }
  }]
}

2. Editing existing code:
{
  "message": "I've updated the function to support different date formats.",
  "operations": [{
    "type": "edit",
    "path": "src/utils/date-formatter.ts",
    "content": "export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {\\n  return format === 'short' ? date.toLocaleDateString() : date.toLocaleString();\\n}",
    "metadata": {
      "description": "Added format parameter to date formatter"
    }
  }]
}

3. Complex multi-file changes:
{
  "message": "I've implemented the authentication system with the following changes:",
  "operations": [
    {
      "type": "mkdir",
      "path": "src/auth",
      "metadata": {
        "description": "Authentication module directory"
      }
    },
    {
      "type": "create",
      "path": "src/auth/types.ts",
      "content": "export interface User {\\n  id: string;\\n  email: string;\\n  role: 'user' | 'admin';\\n}",
      "metadata": {
        "fileType": "typescript",
        "description": "Authentication type definitions"
      }
    },
    {
      "type": "create",
      "path": "src/auth/auth.service.ts",
      "content": "import { User } from './types';\\n\\nexport class AuthService {\\n  async login(email: string, password: string): Promise<User> {\\n    // Implementation\\n  }\\n}",
      "metadata": {
        "fileType": "typescript",
        "requires": ["./types"]
      }
    }
  ]
}

4. Code edits with specific line numbers:
{
  "message": "I've added error handling to the login function",
  "edits": [{
    "type": "replace",
    "path": "src/auth/auth.service.ts",
    "startLine": 5,
    "endLine": 7,
    "content": "    if (!email || !password) {\\n      throw new Error('Email and password are required');\\n    }\\n    // Implementation",
    "description": "Added input validation to login method"
  }]
}

IMPORTANT NOTES:

1. You have FULL ACCESS to read and write files in the workspace
2. You can see the COMPLETE file structure and contents
3. You can create, edit, and delete files and directories
4. You can make ATOMIC changes across multiple files
5. You MUST provide detailed metadata for better IDE integration
6. You can use line-specific edits for precise code changes
7. You have rollback capability if operations fail
8. You can handle dependencies and imports automatically

Remember:
- Always validate file paths before operations
- Include proper import statements
- Maintain consistent code style
- Consider IDE features (types, autocomplete)
- Provide clear success/error messages
- Handle errors gracefully with rollbacks
`; 