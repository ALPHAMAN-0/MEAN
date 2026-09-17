import { TestBed } from '@angular/core/testing'
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter } from '@angular/router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AuthResult } from '@mean/shared'
import { authInterceptor } from './auth.interceptor'
import { AuthStore } from './auth.store'

const authResult = (accessToken: string): { data: AuthResult } => ({
  data: {
    accessToken,
    user: {
      id: 'u1',
      email: 'demo@example.com',
      name: 'Demo',
      role: 'user',
      createdAt: new Date(0).toISOString(),
    },
  },
})

describe('authInterceptor', () => {
  let http: HttpClient
  let backend: HttpTestingController
  let store: AuthStore

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    })
    http = TestBed.inject(HttpClient)
    backend = TestBed.inject(HttpTestingController)
    store = TestBed.inject(AuthStore)
  })

  afterEach(() => backend.verify())

  it('attaches the bearer token and always sends credentials', () => {
    store.accessToken.set('token-1')
    http.get('/api/v1/tasks').subscribe()

    const req = backend.expectOne('/api/v1/tasks')
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-1')
    // Without this the browser never sends the httpOnly refresh cookie.
    expect(req.request.withCredentials).toBe(true)
    req.flush({ data: [] })
  })

  it('refreshes once on a 401 and replays the original request with the new token', () => {
    store.accessToken.set('expired')
    let received: unknown = null
    http.get('/api/v1/tasks').subscribe((body) => (received = body))

    backend.expectOne('/api/v1/tasks').flush({}, { status: 401, statusText: 'Unauthorized' })
    backend.expectOne('/api/v1/auth/refresh').flush(authResult('fresh'))

    const replay = backend.expectOne('/api/v1/tasks')
    expect(replay.request.headers.get('Authorization')).toBe('Bearer fresh')
    replay.flush({ data: [{ id: 't1' }] })

    expect(received).toEqual({ data: [{ id: 't1' }] })
    expect(store.accessToken()).toBe('fresh')
  })

  it('makes exactly ONE refresh call when several requests 401 together', () => {
    store.accessToken.set('expired')
    http.get('/api/v1/tasks').subscribe()
    http.get('/api/v1/auth/me').subscribe()

    backend.expectOne('/api/v1/tasks').flush({}, { status: 401, statusText: 'Unauthorized' })
    backend.expectOne('/api/v1/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' })

    // The single-flight guard in AuthStore. Two refreshes would mean the second
    // presents an already-rotated token — which the server treats as theft and
    // punishes by revoking the entire session family.
    backend.expectOne('/api/v1/auth/refresh').flush(authResult('fresh'))

    backend.expectOne('/api/v1/tasks').flush({ data: [] })
    backend.expectOne('/api/v1/auth/me').flush({ data: {} })
  })

  it('does not try to refresh when the refresh endpoint itself 401s', () => {
    store.refresh().subscribe({ error: () => undefined })

    backend.expectOne('/api/v1/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' })

    // No second refresh: that would be an infinite loop.
    backend.expectNone('/api/v1/auth/refresh')
  })
})
