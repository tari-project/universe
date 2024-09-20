import { useMemo } from 'react';

export enum Environment {
    Development = 'development',
    Production = 'production',
}

export const useEnvironment = () => {
    const environment = useMemo(() => {
        if (window.location.host.startsWith('localhost:')) return Environment.Development;
        return Environment.Production;
    }, []);

    return environment;
};
