import { Component, inject, input, output } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import type { CreateTaskRequest } from '@mean/shared'

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="card new-task" [formGroup]="form" (ngSubmit)="submit()">
      <input
        formControlName="title"
        placeholder="What needs doing?"
        aria-label="Task title"
        maxlength="200"
      />
      <button class="button" type="submit" [disabled]="form.invalid || pending()">Add task</button>
    </form>
  `,
  styles: `
    .new-task {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3);
      margin-bottom: var(--space-6);
    }
  `,
})
export class TaskFormComponent {
  private readonly fb = inject(FormBuilder)

  readonly pending = input(false)
  readonly create = output<CreateTaskRequest>()

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
  })

  protected submit(): void {
    if (this.form.invalid) return
    // No cast needed: CreateTaskRequest is the INPUT type, so `status` is optional
    // here and the server applies the schema default.
    this.create.emit({ title: this.form.getRawValue().title })
    this.form.reset()
  }
}
