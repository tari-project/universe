import React, { createContext, useEffect, useRef, useState } from 'react';
import { MockPortalSdk } from './MockPortalSdk';

export type PortalSdkInstance = MockPortalSdk;

interface PortalSdkContextValue {
    sdk: PortalSdkInstance | null;
    isSdkLoading: boolean;
    sdkError: Error | null;
}

export const PortalSdkContext = createContext<PortalSdkContextValue | undefined>(undefined);

interface PortalSdkProviderProps {
    children: React.ReactNode;
}

type PortalLogLevel = 'debug' | 'info' | 'warn' | 'error';

export const PortalSdkProvider: React.FC<PortalSdkProviderProps> = ({ children }) => {
    const sdkRef = useRef<PortalSdkInstance | null>(null);
    const [isSdkLoading, setIsSdkLoading] = useState(true);
    const [sdkError, setSdkError] = useState<Error | null>(null);

    useEffect(() => {
        const portalLog = (level: PortalLogLevel, ...args: unknown[]) => {
            switch (level) {
                case 'debug':
                    console.debug(args);
                    break;
                case 'info':
                    console.info(args);
                    break;
                case 'warn':
                    console.warn(args);
                    break;
                case 'error':
                    console.error(args);
                    break;
            }
        };

        const initializeSdk = async () => {
            try {
                if (!sdkRef.current) {
                    sdkRef.current = new MockPortalSdk({
                        id: 'TODO_ID',
                        db: 'TODO_DB',
                    });
                }
                if (!sdkRef.current.isStarted) {
                    await sdkRef.current.start();
                }
                sdkRef.current.on('log', portalLog);

                console.info('Portal SDK started.');

                setIsSdkLoading(false);
            } catch (error) {
                console.error('Error starting SDK:', error);
                setSdkError(error as Error);
                setIsSdkLoading(false);
            }
        };

        initializeSdk();

        return () => {
            const stopSdk = async () => {
                if (sdkRef.current && sdkRef.current.isStarted) {
                    try {
                        await sdkRef.current.stop();
                        sdkRef.current.off('log', portalLog);

                        console.info('Portal SDK stopped.');
                    } catch (error) {
                        console.error('Error stopping SDK:', error);
                    }
                }
                sdkRef.current = null;
            };
            stopSdk();
        };
    }, []);

    const contextValue = {
        sdk: sdkRef.current,
        isSdkLoading,
        sdkError,
    };

    return <PortalSdkContext.Provider value={contextValue}>{children}</PortalSdkContext.Provider>;
};
