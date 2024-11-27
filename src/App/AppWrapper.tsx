import { useDisableRefresh } from '@app/hooks/useDisableRefresh';
import { useListenForExternalDependencies } from '@app/hooks/useListenForExternalDependencies';
import { useUpdateListener } from '@app/hooks/useUpdateStatus';
import * as Sentry from '@sentry/react';
import { useEffect } from 'react';

import packageInfo from '../../package.json';
import { useLangaugeResolver } from '../hooks/useLanguageResolver.ts';
import { useAppConfigStore } from '../store/useAppConfigStore.ts';
import { setupLogger } from '../utils/shared-logger.ts';
import { useDetectMode } from '../hooks/helpers/useDetectMode.ts';
import App from './App.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';

// FOR ANYTHING THAT NEEDS TO BE INITIALISED

const environment = import.meta.env.MODE;
const sentryOptions = {
    dsn: 'https://edd6b9c1494eb7fda6ee45590b80bcee@o4504839079002112.ingest.us.sentry.io/4507979991285760',
    integrations: [Sentry.captureConsoleIntegration({ levels: ['warn', 'error'] })],
    release: packageInfo.version,
    environment,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    tracesSampleRate: 1.0,
    attachStacktrace: true,
    autoSessionTracking: false,
    enabled: environment !== 'development',
};

setupLogger();

export default function AppWrapper() {
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const fetchAppConfig = useAppConfigStore((s) => s.fetchAppConfig);
    const setMiningNetwork = useMiningStore((s) => s.setMiningNetwork);

    useDetectMode();
    useDisableRefresh();
    useUpdateListener();
    useLangaugeResolver();
    useListenForExternalDependencies();

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
            await setMiningNetwork();
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
