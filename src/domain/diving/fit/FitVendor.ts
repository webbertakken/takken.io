import type { FitMessages } from '@site/src/domain/diving/fit/FitMessages'

/** Dive-computer vendor a FIT file came from, as far as we can tell. */
export type FitVendor = 'garmin' | 'suunto' | 'unknown'

/**
 * Reads the vendor from `fileIdMesgs[0].manufacturer`. Each tool uses this to
 * notice when it has been handed the other vendor's file and point the diver at
 * the matching tool.
 */
export function detectVendor(messages: FitMessages): FitVendor {
  const fileId = messages.fileIdMesgs?.[0] as { manufacturer?: unknown } | undefined
  const manufacturer = fileId?.manufacturer

  if (manufacturer === 'garmin') return 'garmin'
  if (manufacturer === 'suunto') return 'suunto'
  return 'unknown'
}
