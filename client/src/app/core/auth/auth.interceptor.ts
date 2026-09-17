import { inject } from '@angular/core'
import { type HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http'
import { Router } from '@angular/router'
import { catchError, switchMap, throwError } from 'rxjs'
import { AuthStore } from './auth.store'
import { API_BASE } from '../api.config'

/** Endpoints that must never trigger a refresh — refreshing on their 401 loops. */
const NO_RETRY = [`${API_BASE}/auth/refresh`, `${API_BASE}/auth/login`, `${API_BASE}/auth/register`]

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore)
  const router = inject(Router)

  // withCredentials on every call, or the browser never sends the refresh cookie.
  let request = req.clone({ withCredentials: true })

  const token = store.accessToken()
  if (token) {
    request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const retryable = error.status === 401 && !NO_RETRY.some((url) => req.url.startsWith(url))
      if (!retryable) return throwError(() => error)

      // Everyone who 401s at once joins the SAME refresh, then replays.
      return store.refresh().pipe(
        switchMap((result) =>
          next(request.clone({ setHeaders: { Authorization: `Bearer ${result.accessToken}` } })),
        ),
        catchError((refreshError) => {
          store.clear()
          void router.navigate(['/login'])
          return throwError(() => refreshError)
        }),
      )
    }),
  )
}
