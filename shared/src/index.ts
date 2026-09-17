/**
 * The single public entry point of @mean/shared.
 *
 * Anything a new resource needs on both sides of the wire must be exported from
 * here, or the Angular client cannot see it. See docs/adding-a-resource.md.
 */
export * from './api/envelope.js'
export * from './api/pagination.js'
export * from './auth/user.js'
export * from './tasks/task.js'
