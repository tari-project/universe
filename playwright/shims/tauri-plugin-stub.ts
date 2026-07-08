const handler: ProxyHandler<Record<string, unknown>> = {
  get(_target, prop: string) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return new Proxy({}, handler);
    return (..._args: any[]) => Promise.resolve();
  },
};

export default new Proxy({}, handler);
