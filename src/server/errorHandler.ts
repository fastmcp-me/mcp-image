/**
 * Error Handler utility for unified error processing
 * Provides centralized error handling and Result type wrapping
 */

import type { McpToolResponse } from '../types/mcp'
import {
  FileOperationError,
  GeminiAPIError,
  InputValidationError,
  NetworkError,
  type Result,
} from '../utils/errors'
import { Logger } from '../utils/logger'

// Create logger instance for error handling
const logger = new Logger()

/**
 * Handle an error and convert it to a structured MCP tool response
 * @param error Error to handle
 * @returns MCP tool response with structured error content
 */
function handleError(error: Error): McpToolResponse {
  // Log the error with context
  logger.error('error-handler', 'Error occurred', error, {
    errorType: error.constructor.name,
    stack: error.stack,
  })

  // Convert error to structured format
  const structuredError = {
    error: convertErrorToStructured(error),
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(structuredError),
      },
    ],
    isError: true,
  }
}

/**
 * Wrap an operation with Result type for safe error handling
 * @param operation Operation to execute
 * @param context Optional context for logging
 * @returns Promise resolving to Result type
 */
async function wrapWithResultType<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<Result<T, Error>> {
  try {
    const result = await operation()
    return { ok: true, value: result }
  } catch (error) {
    const finalError = error instanceof Error ? error : new Error('Unknown error')

    if (context) {
      logger.error(context, 'Operation failed', finalError)
    }

    return { ok: false, error: finalError }
  }
}

/**
 * Convert various error types to structured error format
 * @param error Error to convert
 * @returns Structured error object
 */
function convertErrorToStructured(error: Error): {
  code: string
  message: string
  suggestion: string
} {
  if (
    error instanceof InputValidationError ||
    error instanceof FileOperationError ||
    error instanceof GeminiAPIError ||
    error instanceof NetworkError
  ) {
    return {
      code: error.code,
      message: error.message,
      suggestion: error.suggestion,
    }
  }

  // Handle unknown errors
  return {
    code: 'INTERNAL_ERROR',
    message: error.message || 'An unknown error occurred',
    suggestion: 'Contact system administrator',
  }
}

/**
 * Error Handler utilities for unified error processing and Result type wrapping
 * Maintains backward compatibility with static class API
 */
export const ErrorHandler = {
  handleError,
  wrapWithResultType,
} as const
