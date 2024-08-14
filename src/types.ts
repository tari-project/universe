// Use union type
type TauriEventPayload = {
    event_type: 'setup_status' | 'user_idle' | 'user_active';
    title: string;
    progress: number;
};

export type TauriEvent = {
    event: string;
    payload: TauriEventPayload;
};
