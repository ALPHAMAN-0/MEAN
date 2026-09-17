import { Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import type { RegisterInput } from '@mean/shared'
import { AuthStore } from '../../core/auth/auth.store'
import { apiErrorMessage } from '../../shared/api-error'

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card auth">
      <h1>Create an account</h1>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label for="name">Name</label>
          <input id="name" formControlName="name" autocomplete="name" />
        </div>

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
            autocomplete="new-password"
          />
          <!-- 12 characters, matching PasswordSchema in @mean/shared. -->
          <small>At least 12 characters.</small>
        </div>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <button class="button" type="submit" [disabled]="form.invalid || pending()">
          {{ pending() ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <p class="hint">Already registered? <a routerLink="/login">Sign in</a>.</p>
    </section>
  `,
  styles: `
    .auth {
      max-width: 420px;
      margin: 0 auto;
      padding: var(--space-6);
    }
    small {
      color: var(--fg-muted);
      font-size: 0.8rem;
    }
    .hint {
      margin-top: var(--space-6);
      color: var(--fg-muted);
      font-size: 0.875rem;
    }
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder)
  private readonly store = inject(AuthStore)
  private readonly router = inject(Router)

  protected readonly pending = signal(false)
  protected readonly error = signal<string | null>(null)

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
  })

  protected submit(): void {
    if (this.form.invalid) return
    this.pending.set(true)
    this.error.set(null)

    const input = this.form.getRawValue() satisfies RegisterInput
    this.store.register(input).subscribe({
      next: () => void this.router.navigate(['/tasks']),
      error: (err: unknown) => {
        this.error.set(apiErrorMessage(err, 'Could not create the account'))
        this.pending.set(false)
      },
    })
  }
}
