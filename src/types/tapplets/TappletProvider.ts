export interface WindowSize {
    width: number;
    height: number;
}

export interface TappletProviderParams {
    id: string;
    name?: string;
    onConnection?: () => void;
}

export class TappletProvider {
    public providerName = 'TappletProvider';
    id: string;
    params: TappletProviderParams;

    private constructor(
        params: TappletProviderParams,
        public width = 0,
        public height = 0
    ) {
        this.params = params;
        this.id = params.id;
    }

    static build(params: TappletProviderParams): TappletProvider {
        return new TappletProvider(params);
    }
    public setWindowSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    public sendWindowSizeMessage(tappletWindow: Window | null, targetOrigin: string): void {
        tappletWindow?.postMessage({ height: this.height, width: this.width, type: 'resize' }, targetOrigin);
    }

    public requestParentSize(): Promise<WindowSize> {
        return Promise.resolve({ width: this.width, height: this.height });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    async runOne(method: any, args: any[]): Promise<any> {
        const res = (this[method] as (...args: any) => Promise<any>)(...args);
        return res;
    }
}
