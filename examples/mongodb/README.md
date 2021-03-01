# tinyhttp MongoDB example

A simple note app using [tinyhttp](https://github.com/talentlessguy/tinyhttp-deno) and [MongoDB](https://www.mongodb.com).

## Setup

1. Install MongoDB server.

## Run

```sh
deno run --allow-env --allow-read --allow-net server.ts
```

## Endpoints

- `GET /notes` - list notes with 2 properties which are title and desc.

- `POST /notes` - create a post using the data from `title` and `desc` query

- `DELETE /notes` - delete a note with specified ID

- `PUT /notes` - update a note by ID
