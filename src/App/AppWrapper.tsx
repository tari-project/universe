import * as Sentry from '@sentry/react';
import { useEffect } from 'react';

import packageInfo from '../../package.json';
import { useLangaugeResolver } from '../hooks/useLanguageResolver.ts';
import { useAppConfigStore } from '../store/useAppConfigStore.ts';
import { setupLogger } from '../utils/shared-logger.ts';
import { useDetectMode } from '../hooks/helpers/useDetectMode.ts';
import App from './App.tsx';

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

const useDisableRefresh = () => {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            return;
        }
        const keydownListener = function (event: KeyboardEvent) {
            // Prevent F5 or Ctrl+R (Windows/Linux) and Command+R (Mac) from refreshing the page
            if (event.key === 'F5' || (event.ctrlKey && event.key === 'r') || (event.metaKey && event.key === 'r')) {
                event.preventDefault();
            }
        };

        const contextmenuListener = function (event: MouseEvent) {
            event.preventDefault();
        };

        document.addEventListener('keydown', keydownListener);
        document.addEventListener('contextmenu', contextmenuListener);

        return () => {
            document.removeEventListener('keydown', keydownListener);
            document.removeEventListener('contextmenu', contextmenuListener);
        };
    }, []);
};

export default function AppWrapper() {
    useDetectMode();
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const fetchAppConfig = useAppConfigStore((s) => s.fetchAppConfig);
    useLangaugeResolver();
    useDisableRefresh();

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
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
