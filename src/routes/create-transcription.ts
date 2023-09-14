import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { z } from 'zod'
import fs = require("node:fs")
import { routeErrorHandler } from "../lib/route-error-handler"
import { routeRequestSchemaHandler } from "../lib/route-request-schema-handler"
import { prisma } from "../lib/prisma"
import { openAI } from "../lib/openai"

export async function createTranscriptionRoute(app: FastifyInstance) {
    const paramsSchema = z.object({
        videoId: z.string().uuid()
    })

    const bodySchema = z.object({
        prompt: z.string()
    })

    const routeController = async (request: FastifyRequest, reply: FastifyReply) => {
        const { videoId } = paramsSchema.parse(request.params)

        const { prompt } = bodySchema.parse(request.body)

        const video = await prisma.video.findUniqueOrThrow({
            where: {
                id: videoId
            }
        })

        const { path } = video
        const audioReadStream = fs.createReadStream(path)


        const response = await openAI.audio.transcriptions.create({
            file: audioReadStream,
            model: 'whisper-1',
            language: 'pt',
            response_format: 'json',
            temperature: 0,
        })

        const transcription = response.text

        await prisma.video.update({
            where: {
                id: videoId
            },
            data: {
                transcription
            }
        })

        return { transcription }
    }

    const routeHandler = routeErrorHandler(
        routeRequestSchemaHandler(
            routeController,
            paramsSchema,
            bodySchema
        )
    )

    app.post('/videos/:videoId/transcription', routeHandler)
}