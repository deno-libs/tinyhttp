import { Eta } from 'https://deno.land/x/eta@v3.1.0/src/index.ts'
import type { EtaConfig } from 'https://deno.land/x/eta@v3.1.0/src/config.ts'
import { App } from '../../mod.ts'
import { path } from '../../deps.ts'

const eta = new Eta({
  views: path.join(Deno.cwd(), 'views'),
})
const app = new App<EtaConfig>()

app.use(
  (_, res) => {
    res.end(
      eta.render(
        'index',
        { name: 'Eta' },
      ),
    )
  },
)

app.listen(3000, () => console.log(`Listening on http://localhost:3000`))
