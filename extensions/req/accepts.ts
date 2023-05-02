import { accepts, acceptsEncodings, acceptsLanguages } from '../../deps.ts'

export const getAccepts = (req: Request) => (...types: string[]): string | string[] | undefined =>
  accepts(req, ...types)

export const getAcceptsEncodings = (req: Request) => (...encodings: string[]) =>
  acceptsEncodings(req, ...encodings)

export const getAcceptsLanguages = (req: Request) => (...languages: string[]) =>
  acceptsLanguages(req, ...languages)
