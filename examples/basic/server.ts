import { App } from '../../app.ts'

const app = new App()

app.get('/', (_, res) => void res.send('Hello World'))

app.listen(3000, () => console.log(`Started on :3000`))
