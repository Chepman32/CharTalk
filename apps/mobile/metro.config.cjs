const path = require('node:path')
const {
  getDefaultConfig: getReactNativeDefaultConfig,
  mergeConfig,
} = require('@react-native/metro-config')
const { getDefaultConfig: getExpoDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const config = mergeConfig(
  getReactNativeDefaultConfig(projectRoot),
  getExpoDefaultConfig(projectRoot),
)

config.watchFolders = [...new Set([...(config.watchFolders ?? []), workspaceRoot])]
config.resolver.nodeModulesPaths = [
  ...new Set([
    ...(config.resolver.nodeModulesPaths ?? []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ]),
]
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    return context.resolveRequest(
      context,
      path.resolve(projectRoot, 'src', moduleName.slice(2)),
      platform,
    )
  }

  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
