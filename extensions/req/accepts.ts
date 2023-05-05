import { accepts, acceptsEncodings, acceptsLanguages } from '../../deps.ts'

export const getAccepts =
  (req: Request) => (...types: string[]): string | string[] | undefined =>
    accepts(req, ...types)

export const getAcceptsEncodings = (req: Request) => (...encodings: string[]): string | string[] | undefined =>
  acceptsEncodings(req, ...encodings)

export const getAcceptsLanguages =
  (req: Request) => (...languages: string[]): string | string[] | undefined =>
    acceptsLanguages(req, ...languages)
