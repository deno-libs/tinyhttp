import { initAppAndTest } from '../util.ts'
import {
  describe,
  expect,
  it,
  run,
} from 'https://deno.land/x/tincan@1.0.1/mod.ts'

// describe('Response properties', () => {
//   it('should have default HTTP Response properties', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.status = 200;
//       res.json({
//         statusCode: res.status,
//         chunkedEncoding: false,
//       });
//     });

//     await fetch.get('/').expect({
//       statusCode: 200,
//       chunkedEncoding: false,
//     });
//   });
// });

// describe('Response methods', () => {
//   it('res.json stringifies the object', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.json({ hello: 'world' });
//     });

//     await fetch.get('/').expect({ hello: 'world' });
//   });
//   it('res.send sends plain text data', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.send('Hello world');
//     });

//     await fetch.get('/').expect('Hello world');
//   });
//   it('res.send falls back to res.json when sending objects', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.send({ hello: 'world' });
//     });

//     await fetch.get('/').expect({ hello: 'world' });
//   });
//   it('res.status sends status', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.sendStatus(418).end();
//     });

//     await fetch.get('/').expect(418);
//   });
//   it('res.sendStatus sends status + text', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.sendStatus(418);
//     });

//     await fetch.get('/').expect(418, 'Im A Teapot');
//   });
//   it('res.location sends "Location" header', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.location('example.com').end();
//     });

//     await fetch.get('/').expect('Location', 'example.com');
//   });
//   it('res.set sets headers', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.set('X-Header', 'Hello World').end();
//     });

//     await fetch.get('/').expect('X-Header', 'Hello World');
//   });
//   it('res.send sets proper headers', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.send({ hello: 'world' });
//     });

//     await fetch.get('/').expect('Content-Type', 'application/json').expect('Content-Length', '22');
//   });
//   it('res.links sends links', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res
//         .links({
//           next: 'http://api.example.com/users?page=2',
//           last: 'http://api.example.com/users?page=5',
//         })
//         .end();
//     });

//     await fetch
//       .get('/')
//       .expect(
//         'Link',
//         '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last"'
//       );
//   });
//   it('res.cookie sends cookies to client', async () => {
//     const { fetch } = InitAppAndTest((_req, res) => {
//       res.cookie('Hello', 'World').end();
//     });
//     await fetch.get('/').expect('Set-Cookie', 'Hello=World');
//   });
//   describe('res.type(type)', () => {
//     it('should detect MIME type', async () => {
//       const { fetch } = InitAppAndTest((_req, res) => {
//         res.type('html').end();
//       });

//       await fetch.get('/').expect('Content-Type', 'text/html; charset=utf-8');
//     });
//     it('should detect MIME type by extension', async () => {
//       const { fetch } = InitAppAndTest((_req, res) => {
//         res.type('.html').end();
//       });

//       await fetch.get('/').expect('Content-Type', 'text/html; charset=utf-8');
//     });
//   });
// });

// run();
