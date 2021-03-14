# tinyhttp GraphQL example

Simple GraphQL server example with tinyhttp and [gql](https://github.com/deno-libs/gql).

## Run

```sh
deno run --allow-read --allow-net server.ts
```

Then in another terminal:

```sh
$ curl -X POST localhost:3000/graphql -d '{ "query": "{ hello }" }'
{
  "data": {
    "hello": "Hello World!"
  }
}
```
