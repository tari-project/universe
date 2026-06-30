export async function platform() { return 'linux'; }
export async function arch() { return 'x86_64'; }
export async function version() { return '6.0.0'; }
export async function locale() { return 'en-US'; }
export async function hostname() { return 'playwright-test'; }

const osType = async () => 'Linux';
export { osType as type };
