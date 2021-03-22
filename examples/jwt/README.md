# tinyhttp JWT example

Simple JWT validation example with tinyhttp + [djwt](https://github.com/timonson/djwt).

## Run

```sh
deno --allow-net server.ts
```

Then in another terminal:

```sh
$ curl localhost:3000/login
<your token>
$ curl -X POST localhost:3000/protected -d <your token>
Valid JWT
$ curl -X POST localhost:3000/protected -d "random_stuff"
Invalid JWT
```
