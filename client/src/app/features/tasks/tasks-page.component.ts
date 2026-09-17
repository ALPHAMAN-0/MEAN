import { Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type { CreateTaskRequest, PageMeta, TaskDto, TaskStatus } from '@mean/shared'
import { AuthStore } from '../../core/auth/auth.store'
import { apiErrorMessage } from '../../shared/api-error'
import { TaskCardComponent } from './task-card.component'
import { TaskFormComponent } from './task-form.component'
import { TaskService } from './task.service'

@Component({
  selector: 'app-tasks-page',
  imports: [FormsModule, TaskCardComponent, TaskFormComponent],
  template: `
    <h1>Your tasks</h1>
    <p class="subtitle">Signed in as {{ store.user()?.email }}</p>

    <app-task-form [pending]="busy()" (create)="add($event)" />

    <div class="toolbar">
      <label for="status-filter">Filter</label>
      <select id="status-filter" [(ngModel)]="statusFilter" (ngModelChange)="reload(1)">
        <option value="">All</option>
        <option value="todo">To do</option>
        <option value="doing">In progress</option>
        <option value="done">Done</option>
      </select>

      <input
        type="search"
        placeholder="Search titles…"
        aria-label="Search task titles"
        [(ngModel)]="search"
        (keyup.enter)="reload(1)"
      />
      <button type="button" class="button button--ghost" (click)="reload(1)">Search</button>
    </div>

    @if (error(); as message) {
      <p class="error" role="alert">{{ message }}</p>
    }

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (tasks().length === 0) {
      <p class="muted">Nothing here yet. Add your first task above.</p>
    } @else {
      @for (task of tasks(); track task.id) {
        <app-task-card
          [task]="task"
          (statusChange)="setStatus(task, $event)"
          (remove)="remove(task)"
        />
      }

      @if (meta(); as page) {
        <nav class="pager" aria-label="Pagination">
          <button
            type="button"
            class="button button--ghost"
            [disabled]="page.page <= 1"
            (click)="reload(page.page - 1)"
          >
            Previous
          </button>
          <span class="muted"
            >Page {{ page.page }} of {{ page.totalPages }} · {{ page.total }} total</span
          >
          <button
            type="button"
            class="button button--ghost"
            [disabled]="page.page >= page.totalPages"
            (click)="reload(page.page + 1)"
          >
            Next
          </button>
        </nav>
      }
    }
  `,
  styles: `
    .subtitle {
      margin-top: calc(var(--space-2) * -1);
      color: var(--fg-muted);
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }
    .toolbar label {
      color: var(--fg-muted);
      font-size: 0.875rem;
    }
    .toolbar select {
      width: auto;
    }
    .muted {
      color: var(--fg-muted);
    }
    .pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      margin-top: var(--space-6);
    }
  `,
})
export class TasksPageComponent {
  private readonly service = inject(TaskService)
  protected readonly store = inject(AuthStore)

  protected readonly tasks = signal<TaskDto[]>([])
  protected readonly meta = signal<PageMeta | null>(null)
  protected readonly loading = signal(true)
  protected readonly saving = signal(false)
  protected readonly error = signal<string | null>(null)
  protected readonly busy = computed(() => this.loading() || this.saving())

  protected statusFilter: '' | TaskStatus = ''
  protected search = ''

  constructor() {
    this.reload(1)
  }

  protected reload(page: number): void {
    this.loading.set(true)
    this.error.set(null)

    this.service
      .list({
        page,
        pageSize: 10,
        ...(this.statusFilter ? { status: this.statusFilter } : {}),
        ...(this.search.trim() ? { q: this.search.trim() } : {}),
      })
      .subscribe({
        next: (result) => {
          this.tasks.set(result.tasks)
          this.meta.set(result.meta)
          this.loading.set(false)
        },
        error: (err: unknown) => {
          this.error.set(apiErrorMessage(err, 'Could not load tasks'))
          this.loading.set(false)
        },
      })
  }

  protected add(input: CreateTaskRequest): void {
    this.saving.set(true)
    this.service.create(input).subscribe({
      next: () => {
        this.saving.set(false)
        this.reload(1)
      },
      error: (err: unknown) => {
        this.error.set(apiErrorMessage(err, 'Could not create the task'))
        this.saving.set(false)
      },
    })
  }

  protected setStatus(task: TaskDto, status: TaskStatus): void {
    // Optimistic: update the signal now, reconcile with the server's copy after.
    this.tasks.update((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)))

    this.service.update(task.id, { status }).subscribe({
      next: (updated) =>
        this.tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t))),
      error: (err: unknown) => {
        this.error.set(apiErrorMessage(err, 'Could not update the task'))
        this.reload(this.meta()?.page ?? 1)
      },
    })
  }

  protected remove(task: TaskDto): void {
    this.tasks.update((list) => list.filter((t) => t.id !== task.id))
    this.service.remove(task.id).subscribe({
      next: () => this.reload(this.meta()?.page ?? 1),
      error: (err: unknown) => {
        this.error.set(apiErrorMessage(err, 'Could not delete the task'))
        this.reload(this.meta()?.page ?? 1)
      },
    })
  }
}
