export function getCurrentWindow() {
  return {
    label: 'main',
    listen: async (_event: string, _handler: any) => () => {},
    once: async (_event: string, _handler: any) => () => {},
    emit: async (_event: string, _payload?: any) => {},
    setTitle: async () => {},
    show: async () => {},
    hide: async () => {},
    close: async () => {},
    setFocus: async () => {},
    isVisible: async () => true,
    isFullscreen: async () => false,
    setFullscreen: async () => {},
    minimize: async () => {},
    maximize: async () => {},
    unmaximize: async () => {},
    isMaximized: async () => false,
    isMinimized: async () => false,
    center: async () => {},
    setPosition: async () => {},
    setSize: async () => {},
    innerSize: async () => ({ width: 1280, height: 760 }),
    outerSize: async () => ({ width: 1280, height: 760 }),
    innerPosition: async () => ({ x: 0, y: 0 }),
    outerPosition: async () => ({ x: 0, y: 0 }),
    setMinSize: async () => {},
    setMaxSize: async () => {},
  };
}

export function getAllWindows() {
  return [getCurrentWindow()];
}
