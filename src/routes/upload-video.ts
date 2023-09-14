import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { prisma } from "../lib/prisma"
import { pipeline } from 'stream'
import { promisify } from 'util'
import { randomUUID } from "node:crypto"
import fastifyMultipart = require("@fastify/multipart")
import path = require("node:path")
import fs = require("node:fs")
import RouteError from "../lib/route-error"
import { routeErrorHandler } from "../lib/route-error-handler"

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance) {
    app.register(fastifyMultipart, {
        limits: {
            fileSize: 1_848_576 * 25 //25mb,
        }
    })

    const routeController = async (request: FastifyRequest, reply: FastifyReply) => {
        const data = await request.file()

        if (!data) {
            throw new RouteError('Missing file input.')
        }

        const extension = path.extname(data.filename)

        if (extension !== '.mp3') {
            throw new RouteError('Invalid input file type, please upload a MP3.')
        }

        const fileBaseName = path.basename(data.filename, extension)

        const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`

        const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)

        await pump(data.file, fs.createWriteStream(uploadDestination))

        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: uploadDestination,
            }
        })

        return reply.send(video)
    }

    app.post('/videos', routeErrorHandler(routeController))
}