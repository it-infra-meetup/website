import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface OutputLine {
  id: number
  text: string
  className: string
}

const defaultFileSystem: Record<string, string> = {
  "README.md": `# ITインフラ集会 - VRChat Community
================================================
通信インフラを愛する者たちが集う場所。
主な活動：技術交流、LT、機材談義、ねこ。

## Connect
X: https://x.com/it_infra_meetup
Discord: https://discord.gg/7EtJz53ugA
VRC Group: https://vrchat.com/home/group/grp_caa820c4-7aa6-48bc-a7bc-593376245419
`,

  "schedule.txt": `次回集会予定: 2025-12-20
場所: ITインフラ集会 VRChat Group Instance
内容: 雑談会`,

  "access_info.log": `Access Protocol: VRChat
Auth: Public/Group
Status: Online`,

  "network_map.ascii": `      (Internet)
          |
      [Firewall]
          |
    +-----+-----+
    |           |
 [Router]    [Server]`,

  "secret_key.pem": "Error: Permission denied (Public User)"
}

export const useTerminalStore = defineStore('terminal', () => {
  // State
  const commandHistory = ref<string[]>([])
  const outputLines = ref<OutputLine[]>([])
  const fileSystem = ref<Record<string, string>>({ ...defaultFileSystem })

  // Getters
  const outputLineCount = computed(() => outputLines.value.length)
  const historyCount = computed(() => commandHistory.value.length)
  const fileList = computed(() => Object.keys(fileSystem.value))

  // Actions
  function executeCommand(cmd: string): void {
    commandHistory.value.push(cmd)

    const args = cmd.trim().split(/\s+/)
    const command = (args[0] || '').toLowerCase()
    const param = args[1]

    switch(command) {
      case 'ls': {
        const files = fileList.value
          .map(f => `<span class="file-entry">${f}</span>`)
          .join('  ')
        addOutput(files, 'log-ls')
        break
      }

      case 'cat': {
        if (!param) {
          addOutput('usage: cat &lt;filename&gt;', 'log-warn')
        } else if (fileSystem.value[param]) {
          // URLをリンク化
          const content = fileSystem.value[param].replace(
            /(https?:\/\/[^\s<]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer" class="terminal-link">$1</a>'
          )
          addOutput(`<pre class="log-pre">${content}</pre>`, '')
        } else {
          addOutput(`cat: ${param}: No such file or directory`, 'log-err')
        }
        break
      }

      case 'clear': {
        clearOutput()
        break
      }

      case 'help': {
        addOutput(
          "Available commands: <span class='text-yellow-400'>ls</span>, <span class='text-yellow-400'>cat</span>, <span class='text-yellow-400'>clear</span>, <span class='text-yellow-400'>help</span>",
          'log-info'
        )
        break
      }

      default: {
        addOutput(`command not found: ${command}`, 'log-err')
      }
    }
  }

  function addOutput(text: string, className: string = ''): void {
    outputLines.value.push({
      id: Date.now() + Math.random(),
      text,
      className
    })
  }

  function clearOutput(): void {
    outputLines.value = []
  }

  return {
    // State
    commandHistory,
    outputLines,
    fileSystem,
    // Getters
    outputLineCount,
    historyCount,
    fileList,
    // Actions
    executeCommand,
    addOutput,
    clearOutput
  }
})
