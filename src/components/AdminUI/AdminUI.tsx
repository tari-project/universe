/* eslint-disable i18next/no-literal-string */

import { useAppStateStore } from '@app/store/appStateStore';
import { Wrapper, Button } from './styles';

export default function AdminUI() {
    const setCriticalError = useAppStateStore((state) => state.setCriticalError);
    const setError = useAppStateStore((state) => state.setError);

    const errorScenarios = {
        criticalNetwork: 'Critical: Network connectivity issue detected',
        criticalHardware: 'Critical: Hardware malfunction detected',
        normalError: 'Normal error: Operation failed',
        longError:
            'This is a very long error message that should test how the UI handles lengthy error messages in different scenarios and situations',
    };

    return (
        <Wrapper>
            <Button onClick={() => setCriticalError(errorScenarios.criticalNetwork)}>
                Test Critical Network Error
            </Button>
            <Button onClick={() => setCriticalError(errorScenarios.criticalHardware)}>
                Test Critical Hardware Error
            </Button>
            <Button onClick={() => setError(errorScenarios.normalError)}>Test Normal Error</Button>
            <Button onClick={() => setError(errorScenarios.longError)}>Test Long Error</Button>
            <Button
                onClick={() => {
                    setError(undefined);
                    setCriticalError(undefined);
                }}
            >
                Clear Errors
            </Button>
        </Wrapper>
    );
}
