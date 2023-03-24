import { Accepts } from '../../utils/accepts.ts'

export const getAccepts = (req: Request) => (...types: string[]) =>
  new Accepts(req.headers).types(types)

export const getAcceptsEncodings = (req: Request) => (...encodings: string[]) =>
  new Accepts(req.headers).encodings(encodings)

export const getAcceptsCharsets = (req: Request) => (...charsets: string[]) =>
  new Accepts(req.headers).charsets(charsets)

export const getAcceptsLanguages = (req: Request) => (...languages: string[]) =>
  new Accepts(req.headers).languages(languages)
