export enum Environment {
    Development = 'development',
    Production = 'production',
}

export const useEnvironment = () => {
    if (window.location.host.startsWith('localhost:')) return Environment.Development;
    return Environment.Production;
};
