/**
 * Utility functions for slug generation and validation
 */

/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .trim()
    .slice(0, 50) // Limit to 50 chars
}

/**
 * Validate a slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 50
}

/**
 * Get next unique slug by appending numbers
 */
export function getNextSlug(baseSlug: string, counter: number = 1): string {
  if (counter === 1) {
    return baseSlug
  }
  return `${baseSlug}-${counter}`
}
