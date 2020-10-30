/**
 * Last used data
 *
 * Shows the last used data that was used to populate.
 */

import Context from '../context'
import * as Gui from '../gui'
import Options from '../options'
import Strings, * as STRINGS from '@data-populator/core/strings'
import * as Utils from '../utils'

export default async context => {
  Context(context)

  // get last used data
  //let lastUsedData = Utils.documentMetadata(context.document, 'lastUsedData')
  let lastUsedData = Utils.getOrSetPluginSettings('lastUsedData')
  if (!lastUsedData) {
    return Context().document.showMessage(Strings(STRINGS.NO_LAST_USED_DATA))
  }
  lastUsedData = Utils.decode(lastUsedData)

  await Gui.showWindow({
    viewOnly: true,
    options: Options(),
    jsonData: lastUsedData
  })
}
