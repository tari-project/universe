export interface ProcessRetryConfig {
    max_startup_attempts: number;
    startup_retry_delay_secs: number;
    max_runtime_restart_attempts: number;
    runtime_restart_delay_secs: number;
    enable_corruption_detection: boolean;
    corruption_redownload_enabled: boolean;
    max_corruption_redownload_attempts: number;
}

export interface ProcessSpecificConfig {
    max_startup_attempts: number;
    startup_retry_delay_secs: number;
    max_runtime_restart_attempts: number;
    runtime_restart_delay_secs: number;
}

export interface ProcessRetryConfigContent {
    // Global defaults
    default_config: ProcessSpecificConfig;

    // Process-specific overrides
    process_overrides: Record<string, ProcessSpecificConfig>;

    // Global settings
    enable_corruption_detection: boolean;
    corruption_redownload_enabled: boolean;
}

export type RetryReason = 'StartupFailure' | 'RuntimeCrash' | 'BinaryCorruption' | 'HealthCheckFailure';

export interface BinaryRetryEvent {
    process_name: string;
    attempt_number: number;
    max_attempts: number;
    retry_reason: RetryReason;
    next_retry_in_seconds?: number;
}

export interface BinaryCorruptionEvent {
    process_name: string;
    binary_path: string;
    expected_hash?: string;
    actual_hash: string;
    redownload_initiated: boolean;
}

export interface ProcessHealthStatus {
    uptime: number; // Duration in seconds
    restart_count: number;
    health_score: number;
    recent_failures: FailureEvent[];
    performance_metrics: PerformanceMetrics;
}

export interface FailureEvent {
    timestamp: number; // Unix timestamp
    reason: string;
    error_message?: string;
}

export interface PerformanceMetrics {
    cpu_usage: number;
    memory_usage: number;
    response_time: number;
}

export interface SafeModeConfig {
    disable_network: boolean;
    read_only_mode: boolean;
    minimal_features: boolean;
    increased_timeouts: boolean;
}

export interface HealthAlert {
    severity: AlertSeverity;
    process_name: string;
    message: string;
    suggested_actions: string[];
}

export enum AlertSeverity {
    Info = 'info',
    Warning = 'warning',
    Error = 'error',
    Critical = 'critical',
}

export interface CircuitBreakerState {
    state: 'Closed' | 'Open' | 'HalfOpen';
    failure_count: number;
    failure_threshold: number;
    recovery_timeout: number; // Duration in seconds
    last_failure_time?: number; // Unix timestamp
}
