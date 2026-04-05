interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

interface RateLimitConfig {
  interval: number // milliseconds
  uniqueTokenPerInterval: number // max requests per interval
}

interface TokenBucket {
  tokens: number
  lastRefill: number
}

export function rateLimit(config: RateLimitConfig) {
  const { interval, uniqueTokenPerInterval } = config
  const store = new Map<string, TokenBucket>()

  // Cleanup expired entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    const expiredTokens: string[] = []

    for (const [token, bucket] of store.entries()) {
      if (now - bucket.lastRefill > interval * 2) {
        expiredTokens.push(token)
      }
    }

    expiredTokens.forEach((token) => store.delete(token))
  }, 5 * 60 * 1000)

  // Allow cleanup to not block process exit
  cleanupInterval.unref()

  async function check(limit: number, token: string): Promise<RateLimitResult> {
    const now = Date.now()
    let bucket = store.get(token)

    // Initialize or refill bucket
    if (!bucket) {
      bucket = {
        tokens: limit,
        lastRefill: now,
      }
      store.set(token, bucket)
    } else {
      // Calculate tokens to add based on time elapsed
      const timePassed = now - bucket.lastRefill
      const intervalsElapsed = Math.floor(timePassed / interval)

      if (intervalsElapsed > 0) {
        bucket.tokens = Math.min(limit, bucket.tokens + intervalsElapsed * uniqueTokenPerInterval)
        bucket.lastRefill = now - (timePassed % interval)
      }
    }

    // Check if we have tokens available
    const success = bucket.tokens > 0

    if (success) {
      bucket.tokens -= 1
    }

    // Calculate reset time
    const timeSinceLastRefill = now - bucket.lastRefill
    const resetTime = bucket.lastRefill + interval

    return {
      success,
      limit,
      remaining: Math.max(0, bucket.tokens),
      reset: Math.ceil((resetTime - now) / 1000), // Return reset in seconds
    }
  }

  return { check }
}

// Pre-configured limiters
export const publicApiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10,
})

export const authApiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 30,
})

export const adminApiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 60,
})
