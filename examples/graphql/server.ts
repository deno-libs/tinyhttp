import { App } from '../../mod.ts'
import { GraphQLHTTP } from 'https://deno.land/x/gql@1.1.1/mod.ts'
import { buildSchema } from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts'

const schema = buildSchema(`
type Query {
  hello: String
}
`)

const app = new App()

app
  .post(
    '/graphql',
    GraphQLHTTP({
      schema,
      rootValue: {
        hello: () => 'Hello World!'
      }
    })
  )
  .listen(3000, () => console.log(`☁  Started on http://localhost:3000`))
