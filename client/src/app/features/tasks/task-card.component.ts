import { Component, computed, input, output } from '@angular/core'
import type { TaskDto, TaskStatus } from '@mean/shared'

@Component({
  selector: 'app-task-card',
  template: `
    <article class="card task" [class.task--done]="task().status === 'done'">
      <div class="task__main">
        <h3>{{ task().title }}</h3>
        @if (task().description) {
          <p class="task__description">{{ task().description }}</p>
        }
        <p class="task__meta">
          <span class="badge badge--{{ task().status }}">{{ task().status }}</span>
          @if (dueLabel(); as due) {
            <span>due {{ due }}</span>
          }
        </p>
      </div>

      <div class="task__actions">
        <select
          [value]="task().status"
          (change)="statusChange.emit($any($event.target).value)"
          [attr.aria-label]="'Status for ' + task().title"
        >
          @for (option of statuses; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>
        <button type="button" class="button button--ghost" (click)="remove.emit()">Delete</button>
      </div>
    </article>
  `,
  styles: `
    .task {
      display: flex;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4);
      margin-bottom: var(--space-3);
    }
    .task--done h3 {
      text-decoration: line-through;
      color: var(--fg-muted);
    }
    h3 {
      margin: 0 0 var(--space-1);
      font-size: 1rem;
    }
    .task__description {
      margin: 0 0 var(--space-2);
      color: var(--fg-muted);
      font-size: 0.9rem;
    }
    .task__meta {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: 0;
      font-size: 0.8rem;
      color: var(--fg-muted);
    }
    .task__actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-width: 8.5rem;
    }
    .badge {
      padding: 0.1rem var(--space-2);
      border: 1px solid var(--border);
      border-radius: 999px;
    }
    .badge--done {
      color: var(--success);
      border-color: currentcolor;
    }
    .badge--doing {
      color: var(--accent);
      border-color: currentcolor;
    }
  `,
})
export class TaskCardComponent {
  readonly task = input.required<TaskDto>()
  readonly statusChange = output<TaskStatus>()
  readonly remove = output<void>()

  protected readonly statuses: TaskStatus[] = ['todo', 'doing', 'done']

  protected readonly dueLabel = computed(() => {
    const due = this.task().dueDate
    return due ? new Date(due).toLocaleDateString() : null
  })
}
