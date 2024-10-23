import * as Sentry from '@sentry/react';
import packageInfo from '../package.json';
import { invoke } from '@tauri-apps/api';

const environment = import.meta.env.MODE;
const appConfig = await invoke('get_app_config');
const allowTelemetry = appConfig?.allow_telemetry ?? false;

Sentry.init({
    dsn: 'https://edd6b9c1494eb7fda6ee45590b80bcee@o4504839079002112.ingest.us.sentry.io/4507979991285760',
    integrations: [Sentry.captureConsoleIntegration({ levels: ['warn', 'error'] })],
    release: packageInfo.version,
    environment,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    tracesSampleRate: 1.0,
    attachStacktrace: true,
    autoSessionTracking: false,
    enabled: allowTelemetry,
});
