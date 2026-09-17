import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { type Observable, map } from 'rxjs'
import type {
  ApiSuccess,
  CreateTaskRequest,
  ListTasksQuery,
  PageMeta,
  TaskDto,
  UpdateTaskRequest,
} from '@mean/shared'
import { API_BASE } from '../../core/api.config'

export interface TaskPage {
  tasks: TaskDto[]
  meta: PageMeta
}

/**
 * Types come from @mean/shared, so the compiler — not a runtime surprise — tells
 * you when the API's contract changes.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient)
  private readonly url = `${API_BASE}/tasks`

  list(query: Partial<ListTasksQuery> = {}): Observable<TaskPage> {
    let params = new HttpParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value))
    }

    return this.http
      .get<ApiSuccess<TaskDto[]>>(this.url, { params })
      .pipe(map((res) => ({ tasks: res.data, meta: res.meta as PageMeta })))
  }

  create(input: CreateTaskRequest): Observable<TaskDto> {
    return this.http.post<ApiSuccess<TaskDto>>(this.url, input).pipe(map((res) => res.data))
  }

  update(id: string, input: UpdateTaskRequest): Observable<TaskDto> {
    return this.http
      .patch<ApiSuccess<TaskDto>>(`${this.url}/${id}`, input)
      .pipe(map((res) => res.data))
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`)
  }
}
