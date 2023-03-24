import type { ConnInfo, RangesSpecifier } from './deps.ts'

export interface THRequest extends Request {
  _connInfo: ConnInfo
  fresh: boolean
  range: () => -1 | -2 | RangesSpecifier | undefined
}
