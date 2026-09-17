import { Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import type { LoginInput } from '@mean/shared'
import { AuthStore } from '../../core/auth/auth.store'
import { apiErrorMessage } from '../../shared/api-error'

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card auth">
      <h1>Sign in</h1>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
        </div>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <button class="button" type="submit" [disabled]="form.invalid || pending()">
          {{ pending() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="hint">
        No account yet? <a routerLink="/register">Create one</a>.<br />
        Seeded demo login: <code>demo&#64;example.com</code> / <code>Password123!</code>
      </p>
    </section>
  `,
  styles: `
    .auth {
      max-width: 420px;
      margin: 0 auto;
      padding: var(--space-6);
    }
    .hint {
      margin-top: var(--space-6);
      color: var(--fg-muted);
      font-size: 0.875rem;
    }
    code {
      font-family: var(--font-mono);
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder)
  private readonly store = inject(AuthStore)
  private readonly router = inject(Router)

  protected readonly pending = signal(false)
  protected readonly error = signal<string | null>(null)

  // `satisfies LoginInput` on the value type is the drift guard: rename a field in
  // shared/ and this stops compiling instead of failing at runtime.
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  })

  protected submit(): void {
    if (this.form.invalid) return
    this.pending.set(true)
    this.error.set(null)

    const credentials = this.form.getRawValue() satisfies LoginInput
    this.store.login(credentials).subscribe({
      next: () => void this.router.navigate(['/tasks']),
      error: (err: unknown) => {
        this.error.set(apiErrorMessage(err, 'Could not sign in'))
        this.pending.set(false)
      },
    })
  }
}
