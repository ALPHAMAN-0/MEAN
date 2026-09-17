/**
 * The single place the API lives.
 *
 * A relative base is correct for BOTH shipped topologies — the dev server proxies
 * /api to :3000, and nginx proxies it to the api container — so no environment
 * files are needed. Deploying the SPA to a different origin than the API? Change
 * this one constant (and the server's CORS_ORIGINS).
 */
export const API_BASE = '/api/v1'
