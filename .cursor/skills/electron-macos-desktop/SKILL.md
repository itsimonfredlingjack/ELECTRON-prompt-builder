---
name: electron-macos-desktop
description: Build and configure macOS-focused Electron apps with secure sandboxing, entitlements, and DMG distribution. Use when developing Electron desktop apps for macOS, configuring electron-builder for Mac, or securing main/renderer processes.
---

# Electron macOS Desktop

## Security Defaults (Required)

In `BrowserWindow` webPreferences:

```javascript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  preload: path.join(__dirname, 'preload.js'),
  sandbox: true
}
```

Expose only specific APIs via `contextBridge.exposeInMainWorld()`—never expose raw `ipcRenderer` or `require`.

## IPC Pattern

**Preload** – narrow API surface:
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  getApiKey: () => ipcRenderer.invoke('settings:getApiKey'),
  setApiKey: (key) => ipcRenderer.invoke('settings:setApiKey', key),
})
```

**Main** – handle and validate:
```javascript
ipcMain.handle('settings:getApiKey', async () => { /* ... */ })
```

## Sensitive Data Storage

Use `safeStorage` for secrets (API keys):

```javascript
// main process
ipcMain.handle('settings:setApiKey', async (_, key) => {
  const buf = safeStorage.encryptString(key.trim())
  store.set('apiKeyEnc', buf.toString('base64'))
})
ipcMain.handle('settings:getApiKey', async () => {
  const enc = store.get('apiKeyEnc')
  if (!enc) return ''
  return safeStorage.decryptString(Buffer.from(enc, 'base64'))
})
```

Store with `electron-store`; encrypt before save.

## electron-builder macOS Config

```yaml
mac:
  target: [dmg]
  category: public.app-category.developer-tools
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
```

**entitlements.mac.plist**:
```xml
<key>com.apple.security.cs.allow-jit</key><true/>
<key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
<key>com.apple.security.cs.disable-library-validation</key><true/>
```

## Content Security Policy

Update CSP for external APIs in both `index.html` and main process `webRequest.onHeadersReceived`:

```javascript
connect-src 'self' https://api.example.com
```

## macOS Window Behavior

- `app.on('window-all-closed')`: on `darwin`, do NOT call `app.quit()`—macOS apps stay running.
- Frameless window: `frame: false`, custom title bar with `WebkitAppRegion: 'drag'` and `no-drag` on buttons.

## Build Commands

```bash
pnpm run build && electron-builder --mac
```

Output: `release/AppName-1.0.0-arm64.dmg`. Set `publish: null` in config to skip auto-update publishing (avoids GH_TOKEN requirement).
