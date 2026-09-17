import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TaskService } from './task.service'

describe('TaskService', () => {
  let service: TaskService
  let backend: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    service = TestBed.inject(TaskService)
    backend = TestBed.inject(HttpTestingController)
  })

  afterEach(() => backend.verify())

  it('unwraps the { data, meta } envelope', () => {
    let page: { tasks: unknown[]; meta: { total: number } } | undefined
    service.list().subscribe((result) => (page = result))

    backend.expectOne('/api/v1/tasks').flush({
      data: [{ id: 't1', title: 'Ship it' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    })

    expect(page?.tasks).toHaveLength(1)
    expect(page?.meta.total).toBe(1)
  })

  it('sends only the filters that were provided', () => {
    service.list({ page: 2, status: 'done', q: '' }).subscribe()

    const req = backend.expectOne((r) => r.url === '/api/v1/tasks')
    expect(req.request.params.get('page')).toBe('2')
    expect(req.request.params.get('status')).toBe('done')
    // An empty search box must not become `q=`, which would filter everything out.
    expect(req.request.params.has('q')).toBe(false)
    req.flush({ data: [], meta: { page: 2, pageSize: 20, total: 0, totalPages: 1 } })
  })

  it('posts a create request without requiring a status', () => {
    service.create({ title: 'New task' }).subscribe()
    const req = backend.expectOne('/api/v1/tasks')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ title: 'New task' })
    req.flush({ data: { id: 't2' } })
  })
})
