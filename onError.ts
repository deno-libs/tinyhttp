export type ErrorHandler = (err: any, request: Request) => Response

export const onErrorHandler: ErrorHandler = (err, req) => {
  console.log(err)

  return new Response('Bruh', { status: 500 })
}
