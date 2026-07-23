import FitToSsiDiveLogHelper from '@site/src/components/tools/FitToSsiDiveLogHelper'
import { SuuntoFiles } from '@site/src/domain/diving/suunto/SuuntoFiles'
import React from 'react'

const SuuntoToSsiDiveLogHelper = (): React.JSX.Element => (
  <FitToSsiDiveLogHelper
    title="Suunto to SSI DiveLog helper"
    vendorNoun="Suunto"
    vendor="suunto"
    createFiles={() => new SuuntoFiles()}
    exportImage={require('./assets/exporting-fit-file-from-suunto-app.png')}
    exportImageAlt='The Suunto app dive menu with the "Download FIT file" option highlighted'
    exportImageWidth={440}
    exportImageHeight={366}
    exportNote={
      <>
        In the Suunto app, open a dive, tap the <span aria-hidden>⋮</span>{' '}
        <span className="sr-only">more</span> menu, then choose <strong>Download FIT file</strong>.
      </>
    }
    crossLink={{ vendorName: 'Garmin', href: '/tools/garmin-to-ssi-dive-log-helper' }}
  />
)

export default SuuntoToSsiDiveLogHelper
