import { App } from '../../app.ts'
import { renderFile as eta } from 'https://deno.land/x/eta@v1.12.2/mod.ts'
import { EtaConfig } from 'https://deno.land/x/eta@v1.12.2/config.ts'

const app = new App<EtaConfig>()

app.engine('eta', eta)

function func() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('HI FROM ASYNC')
    }, 20)
  })
}

app.use(
  (_, res) =>
    void res.render(
      'index.eta',
      { name: 'Eta', func },
      {
        renderOptions: {
          async: true
        }
      }
    )
)

app.listen(3000, () => console.log(`Listening on http://localhost:3000`))
