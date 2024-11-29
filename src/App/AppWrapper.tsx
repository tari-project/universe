import { IGNORE_FETCHING } from '@app/App/sentryIgnore';
import { initSystray } from '@app/utils';
import * as Sentry from '@sentry/react';
import { useEffect } from 'react';

import {
    useDetectMode,
    useDisableRefresh,
    useLangaugeResolver,
    useListenForExternalDependencies,
    useUpdateListener,
} from '@app/hooks';

import packageInfo from '../../package.json';
import { useAppConfigStore } from '../store/useAppConfigStore.ts';
import setupLogger from '../utils/shared-logger.ts';
import App from './App.tsx';

// FOR ANYTHING THAT NEEDS TO BE INITIALISED

const environment = import.meta.env.MODE;
const sentryOptions = {
    dsn: 'https://edd6b9c1494eb7fda6ee45590b80bcee@o4504839079002112.ingest.us.sentry.io/4507979991285760',
    integrations: [Sentry.captureConsoleIntegration({ levels: ['warn', 'error'] }), Sentry.extraErrorDataIntegration()],
    release: packageInfo.version,
    environment,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    tracesSampleRate: 1.0,
    attachStacktrace: true,
    autoSessionTracking: false,
    ignoreErrors: [...IGNORE_FETCHING],
    enabled: environment !== 'development',
};

setupLogger();

export default function AppWrapper() {
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const fetchAppConfig = useAppConfigStore((s) => s.fetchAppConfig);
    useDetectMode();
    useDisableRefresh();
    useUpdateListener();
    useLangaugeResolver();
    useListenForExternalDependencies();
    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
            await initSystray();
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (allowTelemetry && environment !== 'development') {
            Sentry.init(sentryOptions);
        } else {
            Sentry.close();
        }
    }, [allowTelemetry]);

    return <App />;
}
