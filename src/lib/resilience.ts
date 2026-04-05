/**
 * Resilience Library - Retry and Circuit Breaker patterns
 *
 * Provides exponential backoff with jitter for failed requests,
 * and circuit breaker pattern for protecting against cascading failures.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number
  /** Function to determine if error is retryable (default: retry on 429 and 5xx) */
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit (default: 5) */
  failureThreshold?: number
  /** Time in milliseconds before attempting to half-open (default: 60000) */
  timeout?: number
}

export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is open') {
    super(message)
    this.name = 'CircuitOpenError'
  }
}

/**
 * Retry logic with exponential backoff and jitter
 * Defaults: 3 retries, 1s base delay, 10s max delay
 * Retries on 429 (rate limit) and 5xx errors only
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if we've exhausted attempts or error is not retryable
      if (attempt >= maxRetries || !shouldRetry(error, attempt)) {
        throw error
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      )
      const jitter = Math.random() * exponentialDelay * 0.1
      const delay = exponentialDelay + jitter

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Default retry logic: retry on 429 (rate limit) and 5xx errors
 */
function defaultShouldRetry(error: unknown, attempt: number): boolean {
  // Network errors (no response)
  if (error instanceof TypeError) {
    return true
  }

  // HTTP errors
  if (error instanceof Error && error.message) {
    const msg = error.message.toLowerCase()

    // Check for HTTP status codes in error message
    if (msg.includes('429')) return true // Rate limit
    if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
      return true // Server errors
    }

    // Don't retry 4xx client errors (except 429)
    if (msg.includes('400') || msg.includes('401') || msg.includes('403') || msg.includes('404')) {
      return false
    }
  }

  return true // Retry on unknown errors
}

/**
 * Circuit Breaker Pattern
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail immediately
 * - HALF_OPEN: Testing if service recovered after timeout
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private successCount = 0
  private lastFailureTime: number | null = null
  private readonly failureThreshold: number
  private readonly timeout: number

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5
    this.timeout = options.timeout ?? 60000 // 60 seconds
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed to transition to HALF_OPEN
      const now = Date.now()
      if (
        this.lastFailureTime &&
        now - this.lastFailureTime > this.timeout
      ) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
      } else {
        throw new CircuitOpenError('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await fn()

      // Success - update state
      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++
        // Close circuit after 2 successful requests in HALF_OPEN state
        if (this.successCount >= 2) {
          this.close()
        }
      } else {
        this.failureCount = 0
      }

      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  /**
   * Get the current state of the circuit breaker
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failureCount
  }

  /**
   * Reset the circuit breaker to CLOSED state
   */
  reset(): void {
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    this.state = CircuitState.CLOSED
  }

  /**
   * Manually close the circuit
   */
  private close(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
  }

  /**
   * Record a failure
   */
  private recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN
    }
  }
}
