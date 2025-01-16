import { NextResponse } from 'next/server';
import { AIOperationsService } from './ai-operations';
import { generateSystemPrompt } from '@/prompts/system-prompt';
import { FILE_SYSTEM_TOOL, CODE_EDIT_TOOL, ToolCall } from '@/types/types';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const WORKSPACE_PATH = process.cwd();

if (!DEEPSEEK_API_KEY) {
  throw new Error('Missing DEEPSEEK_API_KEY environment variable');
}

const aiOps = new AIOperationsService(WORKSPACE_PATH);

export async function POST(req: Request) {
  try {
    const { messages, files, currentFile, selection } = await req.json();
    
    // Get workspace context for the system prompt
    const context = aiOps.getWorkspaceContext();
    if (currentFile) context.currentFile = currentFile;
    if (selection) context.selection = selection;
    
    // Generate system prompt with current context
    const systemMessage = {
      role: 'system',
      content: generateSystemPrompt(context)
    };

    // First, get the AI's response
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [systemMessage, ...messages],
        tools: [FILE_SYSTEM_TOOL, CODE_EDIT_TOOL],
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return NextResponse.json(
        { error: `DeepSeek API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message) {
      console.error('Invalid response format:', data);
      return NextResponse.json(
        { error: 'Invalid response format from DeepSeek API' },
        { status: 500 }
      );
    }

    const aiMessage = data.choices[0].message;
    const toolCalls = aiMessage.tool_calls as ToolCall[];
    
    // If there are tool calls, execute them and send results back to AI
    if (toolCalls?.length) {
      const toolMessages = [];
      
      for (const call of toolCalls) {
        const args = JSON.parse(call.function.arguments);
        let result;
        
        switch (call.function.name) {
          case 'file_system_operation': {
            result = await aiOps.executeAIResponse({
              message: aiMessage.content,
              operations: [args]
            });
            break;
          }
          
          case 'code_edit': {
            result = await aiOps.executeAIResponse({
              message: aiMessage.content,
              edits: [args]
            });
            break;
          }
          
          default:
            return NextResponse.json(
              { error: `Unknown tool: ${call.function.name}` },
              { status: 400 }
            );
        }

        toolMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result)
        });
      }

      // Get final response from AI after tool execution
      const finalResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            systemMessage,
            ...messages,
            aiMessage,
            ...toolMessages
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!finalResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to get final response from AI' },
          { status: 500 }
        );
      }

      const finalData = await finalResponse.json();
      return NextResponse.json({
        message: finalData.choices[0].message,
        usage: {
          ...data.usage,
          ...finalData.usage
        }
      });
    }

    // If no tool calls, return the original message
    return NextResponse.json({
      message: aiMessage,
      usage: data.usage
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

