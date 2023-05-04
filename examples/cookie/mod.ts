import { App } from '../../app.ts'

const app = new App()

app
  .get('/', async (req, res) => {
    if (
      req.cookies.get('user') === 'user' &&
      req.cookies.get('password') === 'pwd'
    ) {
      await res.send('<h1>Welcome user!</h1>')
    } else {
      await res.send('<h1>Send cookie to show hidden content</h1>')
    }
  })
  .listen(3000, () => console.log(`Started on http://localhost:3000`))
