/**
 * @type {import('electron-builder').Configuration}
 */
const config = {
  appId: 'com.novelbox.app',
  productName: 'NovelBox',
  directories: {
    output: 'dist',
    buildResources: 'build'
  },
  files: [
    'dist/**/*',
    'main.js',
    'preload.js',
    'package.json',
    '!node_modules/**/*',
    '!src/**/*',
    '!*.log',
    '!*.tmp'
  ],
  extraResources: [
    {
      from: 'src/locales',
      to: 'locales',
      filter: ['**/*.json']
    }
  ],
  extends: null,
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      },
      {
        target: 'zip',
        arch: ['x64']
      }
    ],
    icon: 'build/icon.ico'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'NovelBox',
    uninstallDisplayName: 'NovelBox'
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    category: 'public.app-category.utilities',
    icon: 'build/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      }
    ],
    category: 'Utility',
    maintainer: 'NovelBox Team <novelbox@example.com>',
    icon: 'build/icon.png'
  },
  compression: 'maximum',
  asar: true,
  afterSign: 'scripts/notarize.js'
}

module.exports = config