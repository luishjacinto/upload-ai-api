import { FastifyReply, FastifyRequest } from "fastify"
import RouteError from "./route-error"
import { ZodError } from "zod"

export function routeErrorHandler(
    routeController: (request: FastifyRequest, reply: FastifyReply) => any
) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            return await routeController(request, reply)
        } catch (error) {
            if (error instanceof RouteError) {
                const { message } = error

                return reply.status(400).send({
                    message
                })
            } else if (error instanceof ZodError) {
                return reply.status(400).send(error)
            } else if (error instanceof Error) {
                console.error(`\x1b[31m${error.message}\x1b[0m`)
            }

            return reply.status(400).send()
        }
    }
}