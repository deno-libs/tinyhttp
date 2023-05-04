# PouchDB example

A simple Todo app using tinyhttp and [PouchDB Deno adapter](https://deno.land/x/pouchdb_deno).

## Run

```bash
deno run --allow-net --allow-env --allow-write --allow-read mod.ts
```

## Endpoints

- `GET /todos` - returns all the existing tasks.
- `POST /todos` - adds a new task to the database.
- `PUT /todos` - updates an existing task. Requires the items's `_rev` property along with the `task` and `date`.
- `DELETE /todos` - deletes an existing task. Requires the `_id` and `_rev` property of the target item.
