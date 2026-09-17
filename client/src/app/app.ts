import { Component, inject } from '@angular/core'
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { AuthStore } from './core/auth/auth.store'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(AuthStore)
  private readonly router = inject(Router)

  protected signOut(): void {
    this.store.logout().subscribe(() => void this.router.navigate(['/login']))
  }
}
