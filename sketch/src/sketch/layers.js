/**
 * Layers
 *
 * Provides functionality to get, find, check or otherwise manipulate layers.
 */

import sketch from 'sketch'
import Context from './context'
import * as Utils from './utils'

export const PAGE = 'MSPage'
export const ARTBOARD = 'MSArtboardGroup'
export const GROUP = 'MSLayerGroup'
export const TEXT = 'MSTextLayer'
export const SHAPE = 'MSShapeGroup'
export const BITMAP = 'MSBitmapLayer'
export const SYMBOL = 'MSSymbolInstance'
export const SYMBOL_MASTER = 'MSSymbolMaster'
export const ANY = null

/**
 * Finds layers with specified name in the root layer. The name can be set to '*'
 * and exactMatch to false, in which case all layers are returned.
 *
 * @param {String} name
 * @param {Boolean} exactMatch
 * @param {String} type
 * @param {MSLayer} rootLayer
 * @param {Boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {Array}
 */
export function findLayersInLayer(
  name,
  exactMatch,
  type,
  rootLayer,
  subLayersOnly,
  layersToExclude
) {
  // create predicate format
  let formatRules = ['(name != NULL)']
  let args = []

  // name
  if (name) {
    if (exactMatch) {
      formatRules.push('(name == %@)')
    } else {
      formatRules.push('(name like %@)')
    }
    args.push(name)
  }

  // type
  if (type) {
    if (type === SHAPE) {
      formatRules.push(
        '(className == "MSRectangleShape" OR className == "MSTriangleShape" OR className == "MSOvalShape" OR className == "MSStarShape" OR className == "MSPolygonShape" OR className == "MSShapeGroup")'
      )
    } else {
      formatRules.push('(className == %@)')
    }
    args.push(type)
  } else {
    formatRules.push(
      '(className == "MSLayerGroup" OR className == "MSShapeGroup" OR className == "MSArtboardGroup" OR className == "MSTextLayer" OR className == "MSRectangleShape" OR className == "MSTriangleShape" OR className == "MSOvalShape" OR className == "MSStarShape" OR className == "MSPolygonShape")'
    )
  }

  // layers to exclude
  if (layersToExclude) {
    formatRules.push('NOT (SELF IN %@)')
    args.push(layersToExclude)
  }

  // prepare format string
  let formatString = formatRules.join(' AND ')

  // create predicate
  let predicate = NSPredicate.predicateWithFormat_argumentArray(formatString, args)

  // get layers to filter
  let layers
  if (subLayersOnly) {
    layers = rootLayer.layers()
  } else {
    layers = rootLayer.children()
  }

  // perform query
  let queryResult = layers.filteredArrayUsingPredicate(predicate)

  // return result as js array
  return Utils.convertToJSArray(queryResult)
}

/**
 * Finds a single layer in the root layer.
 *
 * @param {String} name
 * @param {Boolean} exactMatch
 * @param {String} type
 * @param {MSLayer} rootLayer
 * @param {Boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {MSLayer}
 */
export function findLayerInLayer(
  name,
  exactMatch,
  type,
  rootLayer,
  subLayersOnly,
  layersToExclude
) {
  let result = findLayersInLayer(name, exactMatch, type, rootLayer, subLayersOnly, layersToExclude)

  // return first layer in result
  if (result.length) return result[0]
}

/**
 * Finds a set of layer in a set of root layers.
 *
 * @param {String} name
 * @param {Boolean} exactMatch
 * @param {String} type
 * @param {MSLayer} rootLayers
 * @param {Boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {array}
 */
export function findLayersInLayers(
  name,
  exactMatch,
  type,
  rootLayers,
  subLayersOnly,
  layersToExclude
) {
  let layers = []
  rootLayers.forEach(rootLayer => {
    let result = findLayersInLayer(
      name,
      exactMatch,
      type,
      rootLayer,
      subLayersOnly,
      layersToExclude
    )
    layers = layers.concat(result)
  })

  // return all found layers
  return layers
}

/**
 * Finds a single layer in a set of root layers.
 *
 * @param {String} name
 * @param {Boolean} exactMatch
 * @param {String} type
 * @param {MSLayer} rootLayers
 * @param {Boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {array}
 */
export function findLayerInLayers(
  name,
  exactMatch,
  type,
  rootLayers,
  subLayersOnly,
  layersToExclude
) {
  let result = findLayersInLayers(
    name,
    exactMatch,
    type,
    rootLayers,
    subLayersOnly,
    layersToExclude
  )

  // return first layer in result
  if (result.length) return result[0]
}

/**
 * Finds a page with the specified name in the current document.
 *
 * @param {String} name
 * @param {Boolean} fullMatch
 * @returns {MSPage}
 */
export function findPageWithName(name, fullMatch) {
  let doc = MSDocument.currentDocument()
  let pages = Utils.convertToJSArray(doc.pages())
  for (let i = 0; i < pages.length; i++) {
    let currentPage = pages[i]

    // if page matches name
    if (fullMatch) {
      if (currentPage.name() === name) {
        return currentPage
      }
    } else {
      if (currentPage.name().indexOf(name) > -1) {
        return currentPage
      }
    }
  }
}

/**
 * Finds a symbol master by name.
 *
 * @param {String} name
 * @returns {MSSymbolMaster}
 */
export function findSymbolMasterWithName(name) {
  let symbolMaster = sketch.Document.getSelectedDocument()
    .getSymbols()
    .filter(symbol => {
      return symbol.name === name
    })[0]

  // continue looking for the symbol master in libraries
  if (!symbolMaster) {
    let libraries = sketch.getLibraries()
    for (let i = 0; i < libraries.length; ++i) {
      let library = libraries[i]
      if (!library.valid) return

      let symbolReference = library
        .getImportableSymbolReferencesForDocument(Context().document)
        .filter(reference => {
          return reference.name === name
        })[0]

      if (symbolReference) {
        symbolMaster = symbolReference.import()
      }
    }
  }

  return symbolMaster ? symbolMaster.sketchObject : null
}

/**
 * Finds a symbol master by id.
 *
 * @param {String} id
 * @returns {MSSymbolMaster}
 */
export function findSymbolMasterWithId(id) {
  let symbolMaster = sketch.Document.getSelectedDocument()
    .getSymbols()
    .filter(symbol => {
      return symbol.id === id
    })[0]

  // continue looking for the symbol master in libraries
  if (!symbolMaster) {
    let libraries = sketch.getLibraries()
    for (let i = 0; i < libraries.length; ++i) {
      let library = libraries[i]
      if (!library.valid) return

      let symbolReference = library
        .getImportableSymbolReferencesForDocument(Context().document)
        .filter(reference => {
          return reference.id === id
        })[0]

      if (symbolReference) {
        symbolMaster = symbolReference.import()
      }
    }
  }

  return symbolMaster ? symbolMaster.sketchObject : null
}

/**
 * Refreshes text layer boundaries after setting text. This is used as Sketch
 * sometimes forgets to resize the text layer.
 *
 * @param layer
 */
export function refreshTextLayer(layer) {
  layer.adjustFrameToFit()
  layer.select_byExtendingSelection(true, false)
  layer.setIsEditingText(true)
  layer.setIsEditingText(false)
  layer.select_byExtendingSelection(false, false)
}

/**
 * Returns the currently selected layers as a Javascript array.
 *
 * @returns {Array}
 */
export function getSelectedLayers() {
  return Utils.convertToJSArray(Context().document.selectedLayers()).reverse()
}

/**
 * Sets the current layer selection to the provided layers.
 *
 * @param {Array} layers
 */
export function selectLayers(layers) {
  // deselect all layers
  let selectedLayers = getSelectedLayers()
  selectedLayers.forEach(layer => {
    layer.select_byExtendingSelection(false, false)
  })

  // select layers
  layers.forEach(function (layer) {
    layer.select_byExtendingSelection(true, true)
  })
}

/**
 * Adds a page with the specified name to the current document.
 *
 * @param {String} name
 * @returns {MSPage}
 */
export function addPage(name) {
  // get doc
  let doc = Context().document

  // get current page
  let currentPage = doc.currentPage()

  // create new page
  let page = doc.addBlankPage()
  page.setName(name)

  // make current page active again
  doc.setCurrentPage(currentPage)

  return page
}

/**
 * Removes the page with the specified name from the current document.
 *
 * @param {MSPage} page
 */
export function removePage(page) {
  // get doc
  let doc = Context().document

  // get current page
  let currentPage = doc.currentPage()

  // remove page
  doc.removePage(page)

  // make current page active again
  doc.setCurrentPage(currentPage)
}

/**
 * Checks if the layer is a symbol instance.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
export function isSymbolInstance(layer) {
  return layer.isKindOfClass(MSSymbolInstance.class())
}

/**
 * Checks if the layer is a symbol master.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
export function isSymbolMaster(layer) {
  return layer.isKindOfClass(MSSymbolMaster.class())
}

/**
 * Checks if the layer is a layer group.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
export function isLayerGroup(layer) {
  return layer.isKindOfClass(MSLayerGroup.class()) && !layer.isKindOfClass(MSShapeGroup.class())
}

/**
 * Checks if the layer is a shape/shape group.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
export function isLayerShapeGroup(layer) {
  return (
    layer.isKindOfClass(MSShapeGroup.class()) ||
    layer.isKindOfClass(MSRectangleShape.class()) ||
    layer.isKindOfClass(MSTriangleShape.class()) ||
    layer.isKindOfClass(MSOvalShape.class()) ||
    layer.isKindOfClass(MSStarShape.class()) ||
    layer.isKindOfClass(MSPolygonShape.class())
  )
}

/**
 * Checks if the layer is a bitmap layer.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
export function isLayerBitmap(layer) {
  return layer.isKindOfClass(MSBitmapLayer.class())
}

/**
 * Checks if the layer is a text layer.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
export function isLayerText(layer) {
  return layer.isKindOfClass(MSTextLayer.class())
}

/**
 * Checks if the layer is an artboard.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
export function isArtboard(layer) {
  return layer.isKindOfClass(MSArtboardGroup.class())
}

/**
 * Retrieves overrides for a symbol instance.
 *
 * @param {MSSymbolInstance} layer
 * @returns {NSDictionary}
 */
export function getSymbolOverrides(layer) {
  return layer.overrides()
}

/**
 * Sets overrides for a symbol instance.
 *
 * @param {MSSymbolInstance} layer
 * @param {NSDictionary} overrides
 */
export function setSymbolOverrides(layer, overrides) {
  layer.setOverrides(overrides)
  return overrides
}

/**
 * Creates a grid from layers.
 *
 * @param selectedLayers
 * @param opt
 * @returns {Array}
 */
export function createGrid(selectedLayers, opt) {
  // check rows count
  if (!opt.rowsCount || opt.rowsCount < 0) {
    Context().document.showMessage('Number of grid rows must be at least 1.')
    return
  }

  // check rows margin
  if (!opt.rowsMargin && opt.rowsMargin !== 0) {
    Context().document.showMessage('Grid row margin is invalid.')
    return
  }

  // check column count
  if (!opt.columnsCount || opt.columnsCount < 0) {
    Context().document.showMessage('Number of grid columns must be at least 1.')
    return
  }

  // check columns margin
  if (!opt.columnsMargin && opt.columnsMargin !== 0) {
    Context().document.showMessage('Grid column margin is invalid.')
    return
  }

  // get first layer (most top left)
  let layer = selectedLayers[0]
  let smallestX = selectedLayers[0].frame().x()
  let smallestY = selectedLayers[0].frame().y()
  for (let i = 0; i < selectedLayers.length; i++) {
    let tempLayer = selectedLayers[i]
    if (tempLayer.frame().x() < smallestX || tempLayer.frame().y() < smallestY) {
      smallestX = tempLayer.frame().x()
      smallestY = tempLayer.frame().y()
      layer = tempLayer
    }
  }

  // arrange copies of the first layer
  let layerWidth = layer.frame().width()
  let layerHeight = layer.frame().height()
  let layerParent = layer.parentGroup()
  if (!layerParent) layerParent = layer.parentArtboard()
  if (!layerParent) layerParent = layer.parentPage()

  // remove selected layers from parent
  selectedLayers.forEach(function (tempLayer) {
    tempLayer.removeFromParent()
  })

  // keep track of original position
  let startX = layer.frame().x()
  let startY = layer.frame().y()

  // store new selected layers
  let newSelectedLayers = []

  // create rows
  for (let i = 0; i < opt.rowsCount; i++) {
    // set row y
    let y = startY + i * (layerHeight + opt.rowsMargin)

    // create columns
    for (let j = 0; j < opt.columnsCount; j++) {
      // create layer copy
      let copy = Utils.copyLayer(layer)

      // add to parent layer
      layerParent.addLayers([copy])

      // add to selected layers
      newSelectedLayers.push(copy)

      // set column x
      let x = startX + j * (layerWidth + opt.columnsMargin)

      // position copy
      copy.frame().setX(x)
      copy.frame().setY(y)
    }
  }

  return newSelectedLayers
}
