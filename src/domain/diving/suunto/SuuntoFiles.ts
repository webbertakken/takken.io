import { FitFiles } from '@site/src/domain/diving/fit/FitFiles'
import { SuuntoDive } from '@site/src/domain/diving/suunto/SuuntoDive'
import { SuuntoMessages } from '@site/src/domain/diving/suunto/SuuntoMessages'

/** Collects Suunto `.fit`/`.zip` files and yields {@link SuuntoDive}s. */
export class SuuntoFiles extends FitFiles<SuuntoDive> {
  constructor() {
    super((messages) => new SuuntoDive(messages as SuuntoMessages))
  }
}
