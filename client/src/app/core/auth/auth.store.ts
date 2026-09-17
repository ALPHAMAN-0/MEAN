import { Injectable, computed, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { type Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs'
import type { ApiSuccess, AuthResult, LoginInput, PublicUser, RegisterInput } from '@mean/shared'
import { API_BASE } from '../api.config'

/**
 * Session state for the whole app.
 *
 * The access token lives HERE, in memory, and never in localStorage — script
 * running on the page cannot read it back out after an XSS, and it disappears when
 * the tab closes. Durability comes from the httpOnly refresh cookie instead.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient)

  readonly accessToken = signal<string | null>(null)
  readonly user = signal<PublicUser | null>(null)
  readonly isAuthenticated = computed(() => this.user() !== null)
  readonly isAdmin = computed(() => this.user()?.role === 'admin')

  /**
   * The in-flight refresh, shared by every caller.
   *
   * Without this, five concurrent 401s would fire five refreshes, and four of them
   * would present an already-rotated token — which the server correctly treats as
   * theft and punishes by revoking the whole family. Single-flight is not an
   * optimization here; it is required for correctness.
   */
  private inFlight: Observable<AuthResult> | null = null

  login(input: LoginInput): Observable<AuthResult> {
    return this.post('login', input)
  }

  register(input: RegisterInput): Observable<AuthResult> {
    return this.post('register', input)
  }

  refresh(): Observable<AuthResult> {
    this.inFlight ??= this.http
      .post<ApiSuccess<AuthResult>>(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        tap((result) => this.apply(result)),
        finalize(() => {
          this.inFlight = null
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      )
    return this.inFlight
  }

  logout(): Observable<unknown> {
    return this.http.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true }).pipe(
      // A failed logout request must still log you out locally, or a network blip
      // traps you in an app you have asked to leave.
      catchError(() => of(null)),
      tap(() => this.clear()),
    )
  }

  clear(): void {
    this.accessToken.set(null)
    this.user.set(null)
  }

  private post(path: 'login' | 'register', body: unknown): Observable<AuthResult> {
    return this.http
      .post<ApiSuccess<AuthResult>>(`${API_BASE}/auth/${path}`, body, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        tap((result) => this.apply(result)),
      )
  }

  private apply(result: AuthResult): void {
    this.accessToken.set(result.accessToken)
    this.user.set(result.user)
  }
}
