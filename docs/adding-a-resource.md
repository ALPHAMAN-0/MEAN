# Adding a resource

`Task` exists to be copied. This is every file a new resource touches, in the order that keeps the compiler useful — working outward from the contract. The example adds a `Widget`.

The three steps people forget are marked ⚠.

### 1. The contract — `shared/src/widgets/widget.ts`

```ts
import { z } from 'zod'
import { PaginationQuerySchema } from '../api/pagination.js'

export const WidgetDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type WidgetDto = z.infer<typeof WidgetDtoSchema>

export const CreateWidgetSchema = z.object({ name: z.string().trim().min(1).max(200) })
export type CreateWidgetInput = z.infer<typeof CreateWidgetSchema> // what the server receives
export type CreateWidgetRequest = z.input<typeof CreateWidgetSchema> // what the client sends
export const ListWidgetsQuerySchema = PaginationQuerySchema.extend({ q: z.string().optional() })
export type ListWidgetsQuery = z.infer<typeof ListWidgetsQuerySchema>
```

### 2. ⚠ Export it — `shared/src/index.ts`

```ts
export * from './widgets/widget.js'
```

Miss this and the client cannot see the type, with an error that points at the import rather than at the cause.

### 3. The model — `server/src/models/widget.model.ts`

Copy `task.model.ts`. Keep the compound index ordered the way you query: equality field first (`owner`), then the sort key.

### 4. The service — `server/src/modules/widgets/widget.service.ts`

Copy `task.service.ts`. Every query stays owner-scoped in the filter, and a document you do not own is a **404, not a 403** — a 403 confirms the id exists.

### 5. The controller — `server/src/modules/widgets/widget.controller.ts`

Thin. Pull validated input with `validBody<T>(req)` / `validQuery<T>(req)`, call the service, respond with `ok` / `created` / `noContent`.

### 6. The routes — `server/src/modules/widgets/widget.routes.ts`

```ts
export const widgetRouter = Router()
widgetRouter.use(authenticate) // one guard for the whole resource
widgetRouter.get('/', validate({ query: ListWidgetsQuerySchema }), list)
widgetRouter.post('/', validate({ body: CreateWidgetSchema }), create)
```

### 7. ⚠ Mount it — `server/src/routes/index.ts`

```ts
apiRouter.use('/widgets', widgetRouter)
```

### 8. ⚠ Document it — `server/src/docs/openapi.ts`

Add the paths. The spec is generated from these same schemas, so this is the only place the docs can drift from reality.

### 9. Tests — `server/test/widgets.crud.spec.ts`

Copy `tasks.crud.spec.ts` and `tasks.ownership.spec.ts`. The ownership spec is the one worth keeping: it is the test that catches a missing owner filter.

### 10. The client service — `client/src/app/features/widgets/widget.service.ts`

Copy `task.service.ts`. Use `CreateWidgetRequest` (the `z.input` type) for writes, because fields with schema defaults are optional over the wire.

### 11. The screen and its route

A component under `client/src/app/features/widgets/`, then a lazy route in `client/src/app/app.routes.ts`:

```ts
{ path: 'widgets', canActivate: [authGuard],
  loadComponent: () => import('./features/widgets/widgets-page.component').then(m => m.WidgetsPageComponent) }
```

---

Finally: `npm run verify`. If `@mean/shared` looks stale, `npm run build:shared` — the watcher in `make dev` normally handles it.
