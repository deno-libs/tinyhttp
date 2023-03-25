import { App } from "../../app.ts"
import { serveTls } from "https://deno.land/std@0.181.0/http/server.ts"

const app = new App()

app.get('/', (req, res) => void res.send(`Hello World from ${req.protocol}`))

await serveTls(app.handler.bind(app), { onError: app.onError ,  certFile: "./cert.pem",
keyFile: "./key.pem",})