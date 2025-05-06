# Consequences of Waking Up a Machine Running a Mining Node from Sleep Mode

## While running Tari Universe

### Base Node
First log after waking up indicates broken communication pipe used by node to connect to other peers.

```
2025-01-29 14:55:24.170978306 [comms::multiplexing::yamux] [Thread:129377266304576] ERROR 2 Incoming peer substream task received an error because 'i/o error: Broken pipe (os error 32)' // comms/core/src/multiplexing/yamux.rs:300
```

This is probably caused by other peers that marked this node as offline but node immediately dials back and establish new connections.

```
2025-01-29 14:55:24.171419010 [comms::dht::connectivity] [Thread:129377253721664] DEBUG Pool peer 73f660ce77716f831a7e72e8b2 disconnected. Redialling... // comms/dht/src/connectivity/mod.rs:682

2025-01-29 14:55:24.171526288 [comms::connection_manager::dialer] [Thread:129377253721664] DEBUG [Attempt 1] Will attempt connection to peer '73f660ce77716f83' in 0 second(s) // /runner/_work/tari/tari/comms/core/src/connection_manager/dialer.rs:507

2025-01-29 14:55:24.172600511 [comms::connection_manager::dialer] [Thread:129377278887488] DEBUG [Attempt 1] Connecting to peer '73f660ce77716f83' // /runner/_work/tari/tari/comms/core/src/connection_manager/dialer.rs:518

2025-01-29 14:55:27.106283709 [comms::connection_manager::dialer] [Thread:129377278887488] DEBUG Dial succeeded for peer '73f660ce77716f83' after 1 attempt(s) // /runner/_work/tari/tari/comms/core/src/connection_manager/dialer.rs:521
```

### Networking
Remote nodes mark this node as offline and close the socket, causing message transmission failures.

```
2025-01-29 15:03:58.437069300 [comms::connection_manager::dialer] [Thread:14060] DEBUG Failed to dial peer '1c8b393640e1cd7d1a86957eb3' because 'IdentityProtocolError(IoError("An existing connection was forcibly closed by the remote host. (os error 10054)"))' // D:\a\tari\tari\comms\core\src\connection_manager\dialer.rs:254
2025-01-29 15:03:58.437162400 [comms::rpc::client] [Thread:2376] DEBUG Request 1 (method=10) timed out // D:\a\tari\tari\comms\core\src\protocol\rpc\client\mod.rs:755
2025-01-29 15:03:58.437246200 [comms::dht::network_discovery:onconnect] [Thread:2376] DEBUG Error response from peer 71f3ba3aa7bc62718a955b6d01: Timeout: Response timed out // comms\dht\src\network_discovery\on_connect.rs:164
```

Most connections to other peers are closed due to TTL timeout, causing the connection to be lost after the first retry.

```
2025-01-29 15:03:59.188946700 [comms::connection_manager::dialer] [Thread:1572] DEBUG Dial - (Attempt 1) Dial failed on address '/onion3/ohislc44bmyovooseepyksrxgb5unmclnxdxajut7pos4gmhsqd74zad:18141' for peer '4ee514e8472138bf' because 'Transport error for /onion3/ohislc44bmyovooseepyksrxgb5unmclnxdxajut7pos4gmhsqd74zad:18141: TTL expired' // D:\a\tari\tari\comms\core\src\connection_manager\dialer.rs:671
2025-01-29 15:03:59.189022500 [comms::connection_manager::dialer] [Thread:1572] DEBUG Failed to dial peer 4ee514e8472138bf | Attempt 1 | Error: Failed to connect on all addresses for peer // D:\a\tari\tari\comms\core\src\connection_manager\dialer.rs:531
2025-01-29 15:03:59.189065200 [comms::connection_manager::dialer] [Thread:1572] DEBUG Failed to dial peer '4ee514e8472138bf8943a34085' because 'ConnectFailedMaximumAttemptsReached' // D:\a\tari\tari\comms\core\src\connection_manager\dialer.rs:254
```

## Further Investigations

Additional tests should describe the behavior of the node syncing after waking up from sleep mode. Specifically, how nodes recover from lost connections to other peers and possible troubleshooting steps.


## Running xmrig miner on laptop on battery power

There seems to be no big differences when mining on laptop that using unplugged to the power (although some laptops have lower efficiency when using battery so hash rate might be lower). There is a [flag](https://xmrig.com/docs/miner/config/misc#pause-on-battery) in xmirg cpu miner that could disable cpu mining altogether while using battery but currently it's not set up.
