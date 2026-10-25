import FitToSsiDiveLogHelper from '@site/src/components/tools/FitToSsiDiveLogHelper'
import { GarminFiles } from '@site/src/domain/diving/garmin/GarminFiles'
import React from 'react'

const GarminToSsiDiveLogHelper = (): React.JSX.Element => (
  <FitToSsiDiveLogHelper
    title="Garmin to SSI DiveLog helper"
    vendorNoun="garmin"
    vendor="garmin"
    createFiles={() => new GarminFiles()}
    exportImage={require('./assets/exporting-dive-activity-from-garmin-dashboard.png')}
    exportImageAlt="Exporting a dive activity from the Garmin dashboard"
    crossLink={{ vendorName: 'Suunto', href: '/tools/suunto-to-ssi-dive-log-helper' }}
  />
)

export default GarminToSsiDiveLogHelper
