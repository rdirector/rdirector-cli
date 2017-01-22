import React from 'react'
import { Router, Route, browserHistory } from 'react-router'
import isFunction from 'lodash/isFunction'

const getFiles = (req) => req
  .keys()
  .filter((key) => !/\.\w*\.js/.test(key))
  .map((key) => ({
    fileName: key,
    module: req(key)
}))

const scenesReq = require.context('scenes', true, /\.js$/)
const takesReq = require.context('takes', true, /\.js$/)

const scenes = getFiles(scenesReq).map(({ fileName, module }) => ({
  ...module,
  name: fileName.replace(/\.js/, '').replace('./', '').toLowerCase()
}))

const takes = getFiles(takesReq).map(({ fileName, module }) => (
  isFunction(module.default) ? {
    path: fileName.replace(/\.js/, '').replace('./', '/').toLowerCase(),
    component: module.default
  } : module
))

const routes = [
  ...scenes
  .map((scene, index) => (
    <Route key={ index } { ...scene }>
      { takes
        .filter((take) => take.scene === scene.name)
        .map((take, index) => (
          <Route key={ index } { ...take } />
        ))
      }
    </Route>
  )),
  ...takes
  .filter((take) => !take.scene)
  .map((take, index) => (
    <Route key={ index } { ...take } />
  ))
]

export default (
  <Router history={ browserHistory }>
    { routes }
  </Router>
)
