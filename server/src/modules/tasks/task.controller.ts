import type { RequestHandler } from 'express'
import { Types } from 'mongoose'
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '@mean/shared'
import { created, noContent, ok } from '../../lib/respond.js'
import { validBody, validParams, validQuery } from '../../middleware/validate.js'
import * as service from './task.service.js'

const ownerOf = (req: Parameters<RequestHandler>[0]): Types.ObjectId =>
  new Types.ObjectId(req.auth?.sub)

export const list: RequestHandler = async (req, res) => {
  const { tasks, meta } = await service.listTasks(ownerOf(req), validQuery<ListTasksQuery>(req))
  ok(res, tasks, meta)
}

export const getOne: RequestHandler = async (req, res) => {
  const { id } = validParams<{ id: string }>(req)
  ok(res, await service.getTask(ownerOf(req), id))
}

export const create: RequestHandler = async (req, res) => {
  created(res, await service.createTask(ownerOf(req), validBody<CreateTaskInput>(req)))
}

export const update: RequestHandler = async (req, res) => {
  const { id } = validParams<{ id: string }>(req)
  ok(res, await service.updateTask(ownerOf(req), id, validBody<UpdateTaskInput>(req)))
}

export const remove: RequestHandler = async (req, res) => {
  const { id } = validParams<{ id: string }>(req)
  await service.deleteTask(ownerOf(req), id)
  noContent(res)
}
