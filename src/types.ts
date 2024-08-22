// Use union type
type TauriEventPayload = {
    event_type: 'setup_status' | 'user_idle' | 'user_active' | 'current_timeout_duration';
    title: string;
    progress: number;
    duration: number;
};

export type TauriEvent = {
    event: string;
    payload: TauriEventPayload;
};
