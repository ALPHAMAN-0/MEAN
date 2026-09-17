import { inject } from '@angular/core'
import { type CanActivateFn, Router } from '@angular/router'
import { AuthStore } from './auth.store'

export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore)
  const router = inject(Router)

  return (
    store.isAuthenticated() ||
    router.createUrlTree(['/login'], { queryParams: { redirect: state.url } })
  )
}

/** The mirror image: keeps a signed-in user off /login and /register. */
export const guestGuard: CanActivateFn = () => {
  const store = inject(AuthStore)
  const router = inject(Router)
  return !store.isAuthenticated() || router.createUrlTree(['/tasks'])
}
