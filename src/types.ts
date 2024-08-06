// Use union type
type TauriEventPayload = {
    event_type: 'setup_status';
    title: string;
    progress: number;
};

export type TauriEvent = {
    event: string;
    payload: TauriEventPayload;
};
