import {renderFileAsync } from 'https://deno.land/x/eta@v2.0.1/mod.ts'
import type { EtaConfig } from 'https://deno.land/x/eta@v2.0.1/config.ts'
import { App } from "../../mod.ts";

const app = new App<EtaConfig>()

app.engine('eta', renderFileAsync)

function func() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('HI FROM ASYNC')
    }, 20)
  })
}

app.use(
  async (_, res) =>
   { await res.render(
      'index.eta',
      { name: 'Eta', func },
      {
        renderOptions: {
          async: true,
          cache: true
        }
      }
    )}
)

app.listen(3000, () => console.log(`Listening on http://localhost:3000`))