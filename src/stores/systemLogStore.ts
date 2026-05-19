import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface LogEntry {
  id: number
  timestamp: Date
  message: string
  level: 'info' | 'warn' | 'err' | 'ok' | 'debug' | 'default'
}

const defaultLogMessages: string[] = [
  // 既存のメッセージ（タグなし）
  "Initializing kernel...",
  "Starting system services...",
  "Peering with upstream...",
  "Receiving full route table...",
  "Rerouting packets...",
  "Deploying kubernetes cluster...",
  "Reconnection successful.",
  "VRChat API Connected.",
  "User joined: 'Guest'",
  "Synchronization complete.",
  "Power supply: OK",
  "Temperature: 22.5°C",
  "Backup routine started...",

  // Linux / System / Networking
  "[INFO] Systemd: Starting container-runtime.service...",
  "[OK] Container runtime initialized in 1.2s",
  "[INFO] DHCP: lease renewed for 10.42.0.12",
  "[WARN] CPU0 soft lockup detected – recovering...",
  "[INFO] NTP synchronized to pool.ntp.org (offset 0.2ms)",
  "[INFO] SSD health check: PASS (98% remaining)",
  "[INFO] VXLAN tunnel established (id=1001)",
  "[DEBUG] MTU set to 9000 on interface eth1",
  "[INFO] Firewall: new rule applied (policy ACCEPT)",
  "[WARN] Packet drop rate exceeds threshold on eth2",
  "[INFO] WireGuard peer handshake completed",
  "[OK] Log rotation completed",
  "[DEBUG] Process 4481: memory usage increased",
  "[INFO] Netlink: route added via 192.168.254.1",
  "[ERR] DNS query timeout (resolver-02)",
  "[INFO] DNS failover active → switching to resolver-03",
  "[INFO] SNMP trap received from node-14",
  "[WARN] Time drift detected on node-03 (1.8s)",
  "[INFO] Swap usage: 2%",
  "[INFO] Power supply PSU-B: OK",
  "[INFO] Eth0: link up, 100Gbps Full Duplex",
  "[INFO] BGP daemon started",
  "[WARN] High latency detected on node-04",
  "[INFO] RAID6 initialization complete",
  "[ERR] Connection timeout: retrying...",

  // Kubernetes Logs
  "[INFO] kubelet: Node registered: worker-02",
  "[INFO] scheduler: Pod assigned → api-7d946f8d4-h8s5x",
  "[DEBUG] controller: Scaling deployment frontend from 3 → 5",
  "[WARN] etcd: heartbeat latency 120ms",
  "[INFO] kube-proxy: updated endpoints for service backend",
  "[DEBUG] kubelet: Image pulled \"nginx:1.27-alpine\"",
  "[INFO] ingress: certificate reloaded",
  "[WARN] api-server: throttling excessive client requests",
  "[INFO] metrics-server: node metrics updated",
  "[INFO] helm: Release 'monitoring' upgraded",
  "[INFO] kubelet: Pod sandbox created",
  "[ERR] kube-scheduler: bind failed, retrying...",
  "[INFO] cluster-autoscaler: no scale events",
  "[WARN] OOMKilled: pod analytics-0 restarted",
  "[INFO] deployment: rollout completed (version 2025.11.1)",
  "[INFO] cni-calico: added workload endpoint",
  "[DEBUG] kubelet: volume mounted (pvc-db-storage)",
  "[INFO] CRI: GC cleanup finished (removed 13 images)",
  "[WARN] node-05: disk pressure detected",
  "[INFO] api-server: audit log written",

  // Cisco Router / Switch
  "%LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to up",
  "%SYS-5-CONFIG_I: Configured from console by admin",
  "%BGP-5-ADJCHANGE: neighbor 203.0.113.1 Up",
  "%BGP-4-MSG: Received KEEPALIVE from upstream",
  "%OSPF-5-ADJCHG: Process 1, Nbr 10.0.0.2 FULL to INIT",
  "%STP-6-PORTFORWARD: Port-channel1 is forwarding",
  "%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch detected",
  "%IPV6-6-LINKLOCAL: IPv6 link-local address generated",
  "%HSRP-5-STATECHANGE: Standby → Active",
  "%QOS-6-POLICYAPPLIED: QoS policy updated on Gi0/3",
  "%VPN-4-TUNNEL_UP: IPSec tunnel established",
  "%SWITCH-5-TRUNK: VLANs allowed on trunk updated",
  "%POE-3-POWER_INLINE: Insufficient power for device on Gi0/5",
  "%ENV-2-FAN_WARN: Switch fan speed abnormal",
  "%PORT_SECURITY-5-LEARN: MAC learned on Gi0/17",
  "%STACK-5-ROLECHANGE: Member 2 joined stack",
  "%SYS-6-LOGGINGHOST_STARTSTOP: Logging to 10.0.20.7 started",
  "%INLINE_POWER-6-OK: Power granted on Gi0/12",
  "%BUNDLE-4-ADD_MEMBER: Added Gi1/0/2 to Port-channel3",
  "%VTP-5-MODE: Operating in transparent mode",

  // Observability / Cloud / Storage / Security
  "[INFO] Prometheus: scraping target node-05",
  "[WARN] Grafana: panel query took 3.2s",
  "[INFO] Loki: new log stream detected",
  "[INFO] Alertmanager: firing alert HighLatency",
  "[DEBUG] Traces: 14 new spans recorded",
  "[INFO] S3 bucket sync successful",
  "[WARN] IAM: token nearing expiration",
  "[INFO] RAID6 rebuild progress: 74%",
  "[ERR] Backup job failed (exit code 3)",
  "[INFO] Backup retry scheduled in 5m",
  "[INFO] Vault: secret rotated for service/db",
  "[WARN] TLS handshake slow for client 10.2.4.33",
  "[INFO] CDN cache refreshed",
  "[DEBUG] Load balancer: new target added",
  "[INFO] API gateway: rate limit rule updated",
  "[WARN] WAF detected suspicious pattern",
  "[INFO] Object storage: lifecycle rule executed",
  "[INFO] Log archival completed",
  "[DEBUG] Audit: 2 configuration changes detected",
  "[INFO] Security scan: no critical vulnerabilities found",

  // VRChat連携 / ITインフラ雑多ログ
  "[INFO] VRChat API: refreshing world list...",
  "[DEBUG] VRChat: avatar sync request sent",
  "[INFO] New instance created: 'infra-meet-lobby'",
  "[INFO] User joined: 'InfraGuy42'",
  "[INFO] User joined: 'Guest-02'",
  "[WARN] Avatar search latency high",
  "[INFO] Synchronizing environment assets...",
  "[INFO] Voice channel established",
  "[INFO] Spatial audio calibration complete",
  "[DEBUG] Ping to VRChat servers: 42ms",
  "[INFO] World stats: 23 users online",
  "[INFO] Admin tools loaded",
  "[DEBUG] Event hook triggered: onUserJoin",
  "[INFO] VRChat Cloud Storage: sync OK",
  "[INFO] VRChat moderation API heartbeat OK",
  "[WARN] Too many request retries – backing off",
  "[INFO] Theme applied: \"Cyber Infrastructure\"",
  "[DEBUG] Console overlay refreshed",
  "[INFO] End-of-day routine initiated",
  "[INFO] System entering low-noise monitoring mode",

  // 猫
  "nya-",
  "nya-n"
]

export const useSystemLogStore = defineStore('systemLog', () => {
  // State
  const logs = ref<LogEntry[]>([])
  const maxLogs = ref(50)
  const logMessages = ref<string[]>([...defaultLogMessages])

  // Getters
  const logCount = computed(() => logs.value.length)
  const latestLog = computed(() => logs.value[logs.value.length - 1])
  const logCountByLevel = computed(() => {
    return (level: string) => logs.value.filter(log => log.level === level).length
  })

  // Actions
  function addLog(message: string, level?: 'info' | 'warn' | 'err' | 'ok' | 'debug'): void {
    // レベルが指定されていない場合、メッセージから判定
    let detectedLevel: 'info' | 'warn' | 'err' | 'ok' | 'debug' | 'default' = 'default'

    if (level) {
      detectedLevel = level
    } else {
      if (message.includes('[INFO]')) detectedLevel = 'info'
      else if (message.includes('[WARN]')) detectedLevel = 'warn'
      else if (message.includes('[ERR]')) detectedLevel = 'err'
      else if (message.includes('[OK]')) detectedLevel = 'ok'
      else if (message.includes('[DEBUG]')) detectedLevel = 'debug'
      // Cisco形式: %XXX-N-YYY (Nはseverity: 0-2=err, 3-4=warn, 5-7=info)
      else if (message.startsWith('%')) {
        const match = message.match(/^%\w+-(\d)-/)
        if (match && match[1]) {
          const severity = parseInt(match[1], 10)
          if (severity <= 2) detectedLevel = 'err'
          else if (severity <= 4) detectedLevel = 'warn'
          else detectedLevel = 'info'
        }
      }
    }

    logs.value.push({
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      message,
      level: detectedLevel
    })

    // 最大数を超えた場合、古いログを削除
    if (logs.value.length > maxLogs.value) {
      logs.value.shift()
    }
  }

  function addRandomLog(): void {
    const randomMsg = getRandomLogMessage()
    addLog(randomMsg)
  }

  function getRandomLogMessage(): string {
    const index = Math.floor(Math.random() * logMessages.value.length)
    return logMessages.value[index] || logMessages.value[0] || 'System log'
  }

  return {
    // State
    logs,
    maxLogs,
    logMessages,
    // Getters
    logCount,
    latestLog,
    logCountByLevel,
    // Actions
    addLog,
    addRandomLog,
    getRandomLogMessage
  }
})
