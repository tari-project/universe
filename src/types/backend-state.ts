import {
    BackgroundNodeSyncUpdatePayload,
    ConnectedPeersUpdatePayload,
    CriticalProblemPayload,
    DetectedAvailableGpuEngines,
    DetectedDevicesPayload,
    NewBlockHeightPayload,
    NodeTypeUpdatePayload,
    ShowReleaseNotesPayload,
    WalletAddressUpdatePayload,
} from './events-payloads.ts';
import {
    BaseNodeStatus,
    CpuMinerStatus,
    ExternalDependency,
    GpuMinerStatus,
    NetworkStatus,
    WalletBalance,
} from './app-status.ts';
import { ConfigCore, ConfigMining, ConfigUI, ConfigWallet } from './configs.ts';

export enum SetupPhase {
    Core = 'Core',
    Wallet = 'Wallet',
    Hardware = 'Hardware',
    Node = 'Node',
    Unknown = 'Unknown',
}

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
      }
    | {
          event_type: 'NodeTypeUpdate';
          payload: NodeTypeUpdatePayload;
      }
    | {
          event_type: 'ConfigCoreLoaded';
          payload: ConfigCore;
      }
    | {
          event_type: 'ConfigUILoaded';
          payload: ConfigUI;
      }
    | {
          event_type: 'ConfigWalletLoaded';
          payload: ConfigWallet;
      }
    | {
          event_type: 'ConfigMiningLoaded';
          payload: ConfigMining;
      }
    | {
          event_type: 'RestartingPhases';
          payload: SetupPhase[];
      }
    | {
          event_type: 'BackgroundNodeSyncUpdate';
          payload: BackgroundNodeSyncUpdatePayload;
      };
