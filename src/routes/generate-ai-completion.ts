import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { z } from 'zod'
import { streamToResponse, OpenAIStream } from 'ai'
import { routeErrorHandler } from "../lib/route-error-handler"
import { routeRequestSchemaHandler } from "../lib/route-request-schema-handler"
import { prisma } from "../lib/prisma"
import { openAI } from "../lib/openai"
import RouteError from '../lib/route-error';

export async function generateAiCompletionRoute(app: FastifyInstance) {
    const bodySchema = z.object({
        videoId: z.string().uuid(),
        prompt: z.string(),
        temperature: z.number().min(0).max(1).default(0.5)
    })

    const routeController = async (request: FastifyRequest, reply: FastifyReply) => {
        const { videoId, prompt, temperature } = bodySchema.parse(request.body)

        const video = await prisma.video.findUniqueOrThrow({
            where: {
                id: videoId
            }
        })

        if (!video.transcription) {
            throw new RouteError('Video transcription has not been generated yet.')
        }

        const promptMessage = prompt.replace('{transcription}', video.transcription)

        const response = await openAI.chat.completions.create({
            model: 'gpt-3.5-turbo-16k',
            temperature,
            messages: [{
                role: 'user',
                content: promptMessage
            }],
            stream: true
        })

        const stream = OpenAIStream(response)

        streamToResponse(stream, reply.raw, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST'
            }
        })
    }

    const routeHandler = routeErrorHandler(
        routeRequestSchemaHandler(
            routeController,
            undefined,
            bodySchema
        )
    )

    app.post('/ai/complete', routeHandler)
}