import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"
import { routeErrorHandler } from "../lib/route-error-handler"

export async function getAllPromptsRoute(app: FastifyInstance) {
    const routeController = async () => {
        const prompts = await prisma.prompt.findMany()

        return prompts
    }

    app.get('/prompts', routeErrorHandler(routeController))
}