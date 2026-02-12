export function getCurrentWebviewWindow() {
  return {
    label: 'main',
    listen: async (_event: string, _handler: any) => () => {},
    once: async (_event: string, _handler: any) => () => {},
    emit: async (_event: string, _payload?: any) => {},
  };
}

export function getAll() {
  return [getCurrentWebviewWindow()];
}

export class WebviewWindow {
  label: string;
  constructor(label: string) {
    this.label = label;
  }
  async listen(_event: string, _handler: any) { return () => {}; }
  async once(_event: string, _handler: any) { return () => {}; }
  async emit(_event: string, _payload?: any) {}
}
