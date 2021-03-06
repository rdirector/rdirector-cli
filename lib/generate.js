const path = require('path')
const fs = require('fs')
const cli = require('cli')
const sh = require('shelljs')
const kebabCase = require('lodash/kebabCase')
const camelCase = require('lodash/camelCase')
const upperFirst = require('lodash/upperFirst')
const before = require('lodash/before')
const installDependencies = require('./installDependencies')
const messages = require('../config/messages')

const template = {
  scene: {
    component: require('../template/scene'),
    test: require('../template/scene.test'),
  },
  take: {
    component: require('../template/take'),
    test: require('../template/take.test'),
  },
  component: {
    component: require('../template/component'),
    test: require('../template/component.test'),
  },
  container: {
    component: require('../template/component'),
    test: require('../template/component.test'),
  },
  provider: {
    code: require('../template/provider'),
    path: 'src/config/providers.js',
  },
  redux: {
    code: require('../template/redux/provider'),
    path: 'src/config/providers.js',
  },
  reducer: {
    component: require('../template/redux/reducer'),
    test: require('../template/redux/reducer.test')
  },
  routes: {
    from: path.join(__dirname, '..', 'template/boilerplate/src/config/routes.js'),
    to: 'src/config/routes.js',
  },
}

const COMPONENT_TYPES = ['scene', 'take', 'component', 'container', 'reducer']
const INCREMENT_FILE_TYPES = ['provider']
const NO_NAME_TYPES = ['redux', 'routes']
const TYPES = [...COMPONENT_TYPES, ...INCREMENT_FILE_TYPES, ...NO_NAME_TYPES]

module.exports = function generate([ type, name ], options) {
  if (! type || !TYPES.includes(type.toLowerCase())) {
    return cli.error(`${ messages.invalidType } ${ TYPES.join('/') }`)
  }

  if (NO_NAME_TYPES.includes(type)) {
    return generateNoName(type)
  }

  if (!name) {
    return cli.error(`${ messages.invalidTypeName } ${ type }`)
  }

  if (COMPONENT_TYPES.includes(type)) {
    return generateComponent(type, name)
  }

  if (INCREMENT_FILE_TYPES.includes(type)) {
    return generateIncrementFile(type, name)
  }

}

function generateComponent(type, name) {
  const fileDir = `src/${ type }s`
  const fileName = upperFirst(camelCase(name))
  const filePath = `${ fileDir }/${ fileName }.js`
  const testFilePath = `${ fileDir }/${ fileName }.test.js`
  const routePath = kebabCase(name)

  const finished = before(2, () => {
    cli.spinner(`Generating ${ type }: done `, true)
    cli.info(filePath)
    cli.info(testFilePath)
  })

  if (!sh.test('-d', `${ sh.pwd() }/${ fileDir }`)) {
    sh.mkdir(`${ sh.pwd() }/${ fileDir }`)
  }

  cli.spinner('Generating ' + type)
  fs.writeFile(
    `${ sh.pwd() }/${ filePath }`,
    template[type].component({ name, fileName, path: routePath }).replace(/\n/, ''),
    finished
  )
  fs.writeFile(
    `${ sh.pwd() }/${ testFilePath }`,
    template[type].test({ fileName }).replace(/\n/, ''),
    finished
  )
}

function generateIncrementFile(type, name) {
  cli.spinner('Generating ' + type)
  return new Promise((resolve) => fs.writeFile(
    `${ sh.pwd() }/${ template[type].path }`,
    template[type].code({ name: upperFirst(camelCase(name)) }),
    { flag: 'a' },
    () => {
      cli.spinner(`Generating ${ type }: done `, true)
      cli.info(`${ name } ${ type } ${ messages.generatedAt }: ${ template[type].path }`)
      cli.info(messages.providerGenerateInstructions)
      resolve()
    }
  ))
}

function generateNoName(type) {
  switch (type) {
    case 'redux':
      return generateRedux(type)
    default:
      return copyFile(type)
  }
}

function copyFile(type) {
  sh.cp(template[type].from, `${ sh.pwd() }/${ template[type].to }`)
  cli.info(`Generated: ${ template[type].to }`)
}

function generateRedux(type) {
  const dependencies = ['redux', 'react-redux', 'redux-actions']
  const reducersDirPath = `${ sh.pwd() }/src/reducers`
  const reduxStorePath = 'src/config/store.js'
  const reduxStoreTemplatePath = path.join(__dirname, '..', 'template/redux/store.js')
  const reduxMiddlewaresPath = 'src/config/reduxMiddlewares.js'
  const reduxMiddlewaresTemplatePath = path.join(__dirname, '..', 'template/redux/reduxMiddlewares.js')

  cli.spinner(messages.installingDependencies)
  installDependencies(dependencies).then(() => {
    cli.spinner(`${ messages.installingDependencies }: done`, true)
    cli.info(`Installed: ${ dependencies.join(', ') }`)
    generateIncrementFile(type, 'provider').then(() => {
      if (!sh.test('-d', reducersDirPath)) {
        sh.mkdir(reducersDirPath)
      }
      sh.cp(reduxStoreTemplatePath, `${ sh.pwd() }/${ reduxStorePath }`)
      sh.cp(reduxMiddlewaresTemplatePath, `${ sh.pwd() }/${ reduxMiddlewaresPath }`)
      cli.info(`redux store: ${ reduxStorePath }`)
      cli.info(`redux store: ${ reduxMiddlewaresPath }`)
    })
  })
}
