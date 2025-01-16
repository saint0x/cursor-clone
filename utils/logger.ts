import chalk, { ChalkInstance } from 'chalk';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';
type LogCategory = 'agent' | 'file' | 'tool' | 'thought' | 'system';
type ChalkColor = 'gray' | 'blue' | 'yellow' | 'red' | 'green' | 'magenta' | 'cyan';

interface LogMetadata {
  requestId?: string;
  sessionId?: string;
  userId?: string;
  duration?: number;
  size?: number;
  path?: string;
  operation?: string;
  status?: string;
  [key: string]: any;
}

interface LogOptions {
  level?: LogLevel;
  category?: LogCategory;
  emoji?: string;
  color?: ChalkColor;
  timestamp?: boolean;
  metadata?: LogMetadata;
}

const LOG_LEVELS: Record<LogLevel, { emoji: string; color: ChalkColor; priority: number }> = {
  debug: { emoji: '🔍', color: 'gray', priority: 0 },
  info: { emoji: 'ℹ️', color: 'blue', priority: 1 },
  warn: { emoji: '⚠️', color: 'yellow', priority: 2 },
  error: { emoji: '❌', color: 'red', priority: 3 },
  success: { emoji: '✅', color: 'green', priority: 1 }
};

const CATEGORIES: Record<LogCategory, { emoji: string; color: ChalkColor }> = {
  agent: { emoji: '🤖', color: 'magenta' },
  file: { emoji: '📄', color: 'cyan' },
  tool: { emoji: '🛠️', color: 'yellow' },
  thought: { emoji: '💭', color: 'blue' },
  system: { emoji: '⚙️', color: 'gray' }
};

interface ToolLogger {
  complete: (success: boolean, result?: any) => void;
}

class Logger {
  private sessionId: string;
  private requestCounter: number = 0;

  constructor() {
    this.sessionId = Math.random().toString(36).substring(2, 15);
  }

  private getTimestamp(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  private getRequestId(): string {
    return `req_${this.sessionId}_${++this.requestCounter}`;
  }

  private formatMetadata(metadata: LogMetadata = {}): string {
    const formatted = Object.entries(metadata)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join(' ');
    return formatted ? chalk.gray(`[${formatted}]`) : '';
  }

  private getChalkColor(color: ChalkColor): (text: string) => string {
    return (chalk as unknown as Record<ChalkColor, (text: string) => string>)[color];
  }

  private formatMessage(message: string, options: LogOptions = {}): string {
    const {
      level = 'info',
      category,
      emoji: customEmoji,
      color: customColor,
      timestamp = true,
      metadata = {}
    } = options;

    const levelConfig = LOG_LEVELS[level];
    const categoryConfig = category ? CATEGORIES[category] : null;
    const messageColor = customColor || levelConfig.color;

    // Format the main message with level and category
    const mainParts = [
      levelConfig.emoji,
      categoryConfig ? categoryConfig.emoji : null,
      this.getChalkColor(messageColor)(message)
    ].filter(Boolean);

    // Format metadata in gray
    const metaParts = [];
    
    // Add timestamp in gray
    if (timestamp) {
      metaParts.push(`[${this.getTimestamp()}]`);
    }

    // Add request ID in gray
    const reqId = metadata.requestId || this.getRequestId();
    metaParts.push(`[${reqId}]`);

    // Add any custom metadata in gray
    const metadataStr = this.formatMetadata(metadata);
    if (metadataStr) {
      metaParts.push(metadataStr);
    }

    // Combine main message and metadata
    return [
      mainParts.join(' '),
      chalk.gray(metaParts.join(' '))
    ].join('  ');
  }

  private log(message: string, options: LogOptions = {}): void {
    const formattedMessage = this.formatMessage(message, options);
    
    // Log to appropriate stream based on level
    const level = options.level || 'info';
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  // Agent Thought Process Logging
  thought(message: string, type: 'reasoning' | 'plan' | 'criticism' = 'reasoning', metadata: LogMetadata = {}): void {
    const emojis = {
      reasoning: '🤔',
      plan: '📋',
      criticism: '🔍'
    };

    this.log(message, {
      category: 'thought',
      emoji: emojis[type],
      color: 'blue',
      metadata: {
        ...metadata,
        thoughtType: type
      }
    });
  }

  // Tool Execution Logging
  tool(name: string, args: any, metadata: LogMetadata = {}): ToolLogger {
    const startTime = Date.now();
    
    this.log(`Executing ${name}`, {
      category: 'tool',
      level: 'info',
      metadata: {
        ...metadata,
        tool: name,
        startTime: this.getTimestamp()
      }
    });

    this.log(JSON.stringify(args, null, 2), {
      category: 'tool',
      level: 'debug',
      emoji: '📝',
      metadata: {
        ...metadata,
        tool: name,
        argsSize: JSON.stringify(args).length
      }
    });

    return {
      complete: (success: boolean, result?: any) => {
        const duration = Date.now() - startTime;
        this.log(`Tool ${name} ${success ? 'completed' : 'failed'}`, {
          category: 'tool',
          level: success ? 'success' : 'error',
          metadata: {
            ...metadata,
            tool: name,
            duration,
            success,
            resultSize: result ? JSON.stringify(result).length : 0
          }
        });
      }
    };
  }

  // File Operations Logging
  file(operation: string, path: string, success = true, metadata: LogMetadata = {}): void {
    const level = success ? 'success' : 'error';
    this.log(`${operation}: ${path}`, {
      category: 'file',
      level,
      metadata: {
        ...metadata,
        operation,
        path,
        success
      }
    });
  }

  // Agent State Logging
  agent(state: string, details?: any, metadata: LogMetadata = {}): void {
    this.log(state, {
      category: 'agent',
      level: 'info',
      metadata: {
        ...metadata,
        state,
        details: details ? JSON.stringify(details) : undefined
      }
    });
  }

  // System Events
  system(message: string, level: LogLevel = 'info', metadata: LogMetadata = {}): void {
    this.log(message, {
      category: 'system',
      level,
      metadata
    });
  }

  // Convenience methods for different log levels
  debug(message: string, category?: LogCategory, metadata: LogMetadata = {}): void {
    this.log(message, { level: 'debug', category, metadata });
  }

  info(message: string, category?: LogCategory, metadata: LogMetadata = {}): void {
    this.log(message, { level: 'info', category, metadata });
  }

  warn(message: string, category?: LogCategory, metadata: LogMetadata = {}): void {
    this.log(message, { level: 'warn', category, metadata });
  }

  error(message: string, category?: LogCategory, metadata: LogMetadata = {}): void {
    this.log(message, { level: 'error', category, metadata });
  }

  success(message: string, category?: LogCategory, metadata: LogMetadata = {}): void {
    this.log(message, { level: 'success', category, metadata });
  }
}

export const logger = new Logger();

// Usage examples:
/*
logger.thought('Analyzing user request for code generation', 'reasoning');
logger.thought('1. Create file structure\n2. Generate code\n3. Add tests', 'plan');
logger.thought('Could add more error handling', 'criticism');

logger.tool('file_system_operation', {
  type: 'create',
  path: 'src/utils/helper.ts',
  content: '...'
});

logger.file('CREATE', 'src/utils/helper.ts', true);
logger.file('DELETE', 'temp.txt', false);

logger.agent('Processing request', {
  type: 'code_generation',
  language: 'typescript',
  complexity: 'medium'
});

logger.system('Server started on port 3000');
logger.error('Failed to connect to database', 'system');
*/ 