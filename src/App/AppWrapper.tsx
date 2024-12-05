import { useEffect } from 'react';
import { defaultOptions } from 'tauri-plugin-sentry-api';
import * as Sentry from '@sentry/react';
import { IGNORE_FETCHING } from '@app/App/sentryIgnore';
import { initSystray } from '@app/utils';

import {
    useCheckUpdate,
    useDetectMode,
    useDisableRefresh,
    useInterval,
    useLangaugeResolver,
    useListenForExternalDependencies,
} from '@app/hooks';

import packageInfo from '../../package.json';
import { useAppConfigStore } from '../store/useAppConfigStore.ts';
import setupLogger from '../utils/shared-logger.ts';
import App from './App.tsx';
import useListenForCriticalProblem from '@app/hooks/useListenForCriticalProblem.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';

// FOR ANYTHING THAT NEEDS TO BE INITIALISED

const environment = import.meta.env.MODE;
const sentryOptions = {
    ...defaultOptions,
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

const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour

export default function AppWrapper() {
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const fetchAppConfig = useAppConfigStore((s) => s.fetchAppConfig);
    const setMiningNetwork = useMiningStore((s) => s.setMiningNetwork);
    const checkUpdateTariUniverse = useCheckUpdate();

    useDetectMode();
    useDisableRefresh();
    useLangaugeResolver();
    useListenForExternalDependencies();
    useListenForCriticalProblem();

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
            checkUpdateTariUniverse(); // first check
            await initSystray();
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

    useInterval(() => checkUpdateTariUniverse(), UPDATE_CHECK_INTERVAL);

    return <App />;
}
