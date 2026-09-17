import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { catchError, firstValueFrom, of } from 'rxjs'
import { routes } from './app.routes'
import { authInterceptor } from './core/auth/auth.interceptor'
import { AuthStore } from './core/auth/auth.store'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    /**
     * Try one silent refresh before the app renders, so a page reload keeps you
     * signed in — the access token only ever lived in memory, but the httpOnly
     * cookie survived. A failure just means "not signed in", never a boot error.
     * (provideAppInitializer, not the deprecated APP_INITIALIZER token.)
     */
    provideAppInitializer(() => {
      const store = inject(AuthStore)
      return firstValueFrom(store.refresh().pipe(catchError(() => of(null))))
    }),
  ],
}
