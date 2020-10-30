/**
 * Populate from URL
 *
 * Populates the selected layers from a URL.
 */

import Context from '../context'
import * as Gui from '../gui'
import * as Layers from '../layers'
import * as Populator from '../populator'
import Options, * as OPTIONS from '../options'
import Strings, * as STRINGS from '@data-populator/core/strings'
import * as Utils from '../utils'

export default async (context, populateAgain) => {
  Context(context)

  // get selected layers
  let selectedLayers = Layers.getSelectedLayers()
  if (!selectedLayers.length) {
    return Context().document.showMessage(Strings(STRINGS.SELECT_LAYERS_TO_POPULATE))
  }

  // get options and data
  let options = Options()
  options[OPTIONS.POPULATE_TYPE] = OPTIONS.POPULATE_TYPE_URL
  let data = null
  if (populateAgain) {
    // load preset data
    if (!options[OPTIONS.URL]) return
    data = await Gui.call('loadURLData', {
      url: options[OPTIONS.URL],
      headers: options[OPTIONS.HEADERS]
    })
    data = Utils.accessObjectByString(data, options[OPTIONS.DATA_PATH] || '')
    if (!data) return
  } else {
    // wait for user response including options and json data to be used
    let response = await Gui.showWindow({
      options
    })

    // terminate if cancelled
    if (!response) return

    // get updated options and json data
    options = response.options
    data = response.data

    // create grid
    if (options[OPTIONS.CREATE_GRID]) {
      selectedLayers = Layers.createGrid(selectedLayers, {
        rowsCount: options[OPTIONS.ROWS_COUNT],
        rowsMargin: options[OPTIONS.ROWS_MARGIN],
        columnsCount: options[OPTIONS.COLUMNS_COUNT],
        columnsMargin: options[OPTIONS.COLUMNS_MARGIN]
      })

      // make sure that grid creation was successful
      // could have failed if zero rows were requested for example
      if (!selectedLayers) return
    }
  }

  // get root dir used when populating local images
  // in case of url population, only remote images can be retrieved
  options.rootDir = '/'

  // save options
  Options(options)

  // store data used to populate the layers
  //Utils.documentMetadata(context.document, 'lastUsedData', Utils.encode(data))
  Utils.getOrSetPluginSettings('lastUsedData', Utils.encode(data))

  // populate selected layers
  Populator.populateLayers(selectedLayers, data, options)

  // restore selected layers
  Layers.selectLayers(selectedLayers)

  context.document.reloadInspector()
}
