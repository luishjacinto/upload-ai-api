import { FastifyReply, FastifyRequest } from "fastify"
import { UnknownKeysParam, ZodObject, ZodRawShape, ZodTypeAny, objectOutputType, ZodError } from 'zod'

type ZodSchema = ZodObject<ZodRawShape, UnknownKeysParam, ZodTypeAny, objectOutputType<ZodRawShape, ZodTypeAny, UnknownKeysParam>>

function createInvalidSchemaResponse(key: 'params' | 'body', error: ZodError) {
    return {
        message: `Invalid '${key}' value, please fix and try again`,
        errors: error.errors.map(error => {
            const { message, path } = error
            return {
                path,
                message
            }
        })
    }
}

export function routeRequestSchemaHandler(
    routeController: (request: FastifyRequest, reply: FastifyReply) => any,
    paramsSchema?: ZodSchema,
    bodySchema?: ZodSchema
) {
    return async (request: FastifyRequest, reply: FastifyReply) => {

        try {
            paramsSchema?.parse(request.params)
        } catch (error) {
            if (error instanceof ZodError) {
                return reply.status(400).send(createInvalidSchemaResponse('params', error))
            }
        }

        try {
            bodySchema?.parse(request.body)
        } catch (error) {
            if (error instanceof ZodError) {
                return reply.status(400).send(createInvalidSchemaResponse('body', error))
            }
        }

        return await routeController(request, reply)
    }
}