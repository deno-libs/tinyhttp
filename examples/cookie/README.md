# Cookie example

Example of using cookies in tinyhttp.

## Run

```sh
deno run --allow-net mod.ts
```

And then in another terminal, run:

```sh
curl --cookie "user=user;password=pwd" http://localhost:3000
```
