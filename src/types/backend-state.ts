import {
    ConnectedPeersUpdatePayload,
    CriticalProblemPayload,
    DetectedAvailableGpuEngines,
    DetectedDevicesPayload,
    NewBlockHeightPayload,
    ResumingAllProcessesPayload,
    ShowReleaseNotesPayload,
    WalletAddressUpdatePayload,
} from './events-payloads.ts';
import {
    AppConfig,
    BaseNodeStatus,
    CpuMinerStatus,
    ExternalDependency,
    GpuMinerStatus,
    NetworkStatus,
    WalletBalance,
} from './app-status.ts';

export const BACKEND_STATE_UPDATE = 'backend_state_update';
export type BackendStateUpdateEvent =
    | {
          event_type: 'WalletAddressUpdate';
          payload: WalletAddressUpdatePayload;
      }
    | {
          event_type: 'BaseNodeUpdate';
          payload: BaseNodeStatus;
      }
    | {
          event_type: 'WalletBalanceUpdate';
          payload: WalletBalance;
      }
    | {
          event_type: 'CpuMiningUpdate';
          payload: CpuMinerStatus;
      }
    | {
          event_type: 'GpuMiningUpdate';
          payload: GpuMinerStatus;
      }
    | {
          event_type: 'ConnectedPeersUpdate';
          payload: ConnectedPeersUpdatePayload;
      }
    | {
          event_type: 'NewBlockHeight';
          payload: NewBlockHeightPayload;
      }
    | {
          event_type: 'AppConfigLoaded';
          payload: AppConfig;
      }
    | {
          event_type: 'CloseSplashscreen';
          payload: undefined;
      }
    | {
          event_type: 'DetectedDevices';
          payload: DetectedDevicesPayload;
      }
    | {
          event_type: 'DetectedAvailableGpuEngines';
          payload: DetectedAvailableGpuEngines;
      }
    | {
          event_type: 'ResumingAllProcesses';
          payload: ResumingAllProcessesPayload;
      }
    | {
          event_type: 'CriticalProblem';
          payload: CriticalProblemPayload;
      }
    | {
          event_type: 'MissingApplications';
          payload: ExternalDependency[];
      }
    | {
          event_type: 'StuckOnOrphanChain';
          payload: boolean;
      }
    | {
          event_type: 'ShowReleaseNotes';
          payload: ShowReleaseNotesPayload;
      }
    | {
          event_type: 'NetworkStatus';
          payload: NetworkStatus;
      }
    | {
          event_type: 'CorePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'WalletPhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'HardwarePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'NodePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'UnknownPhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'UnlockApp';
          payload: undefined;
      }
    | {
          event_type: 'UnlockWallet';
          payload: undefined;
      }
    | {
          event_type: 'UnlockMining';
          payload: undefined;
      }
    | {
          event_type: 'LockWallet';
          payload: undefined;
      }
    | {
          event_type: 'LockMining';
          payload: undefined;
      };
