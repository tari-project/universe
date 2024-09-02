// Use union type
interface TauriEventPayload {
    event_type: 'setup_status' | 'user_idle' | 'user_active' | 'current_timeout_duration';
    title: string;
    progress: number;
    duration: number;
}

export interface TauriEvent {
    event: string;
    payload: TauriEventPayload;
}
