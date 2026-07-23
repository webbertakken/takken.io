/**
 * The decoded message set of a FIT file, keyed by message type
 * (e.g. `sessionMesgs`, `recordMesgs`). Vendor-specific message interfaces
 * extend this so a decoded file can always be treated generically (for the
 * developer-data view) or narrowly (by a vendor adapter).
 */
export interface FitMessages {
  [messageType: string]: unknown[] | undefined
}
