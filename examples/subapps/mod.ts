import { App } from '../../app.ts'

const app = new App()

const subApp = new App()

subApp.use((_, res) => void res.end('Hello World!'))

app.use('/subapp', subApp)

await app.listen(3000)
