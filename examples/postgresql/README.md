# tinyhttp PostgreSQL example

A simple note app using [tinyhttp](https://github.com/talentlessguy/tinyhttp-deno), [deno-postgres](https://deno-postgres.com) and [PostgreSQL](https://www.postgresql.org/).

## Setup

1. Install PostgreSQL server.

## Run

```sh
deno run --allow-env --allow-read --allow-net server.ts
```

## Endpoints

- `GET /notes` - list notes with 2 properties which are title and desc.

- `POST /notes` - create a post using the data from `title` and `desc` query
