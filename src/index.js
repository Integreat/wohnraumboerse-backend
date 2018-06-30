// @flow

import 'babel-polyfill'
import http from 'http'
import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import initializeDb from './db'
import fs from 'fs'
import api from './api'
import type {Config} from './Config'
import initializeServices from './services/initializeServices'
import commander from 'commander'
import cosmiconfig from 'cosmiconfig'
import type {$Request, $Response} from '../flow-typed/npm/express_v4.16.x'

commander.version('0.0.1').parse(process.argv)

const explorer = cosmiconfig('neuburg-backend')
const result = explorer.searchSync()

if (!result) {
  console.error('Failed to find config!')
  process.exit(1)
}

const config: Config = result.config

const services = initializeServices(config)
const app = express()

const server = http.createServer(app)

// logger
morgan.token('error', (request: $Request, response: $Response): string => response.error ? `\n${response.error}` : '')
app.use(morgan('[:date[clf]] :method :url :response-time ms :error', {stream: fs.createWriteStream('./access.log', {flags: 'a'})}))

app.use(
  bodyParser.json({
    limit: config.bodyLimit
  })
)

// api router
app.use('/', api(services))

// connect to db
const db = initializeDb(config.mongoDBUrl)
db.on('error', (message: string) => {
  console.error(message)
  process.exit(1)
})

db.once('open', () => {
  console.log('Connected to DB.')
  const CONNECTION_QUEUE_SIZE = 10
  server.listen(parseInt(process.env.PORT) || config.port, process.env.IP || config.host, CONNECTION_QUEUE_SIZE, () => {
    console.log(`Started on port ${server.address().port}`)
  })
})

export default app
