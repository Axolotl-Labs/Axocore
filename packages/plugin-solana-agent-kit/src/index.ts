import { SolanaAgentKit, createSolanaTools } from 'solana-agent-kit'

const actions: Record<string, any> = {}
const init = async ({
  walletPrivateKey,
  rpcUrl,
}: {
  walletPrivateKey: string
  rpcUrl: string
}) => {
  const inputRegex = /(\w+\??):\s*(.+)/g
  const agent = new SolanaAgentKit(walletPrivateKey, rpcUrl, null)

  const tools = createSolanaTools(agent)
  tools.map((tool) => {
    const name = tool.name.toUpperCase()
    const desc = tool.description.split('\n')[0]
    const actionParams: Record<string, string> = {}

    for (const match of tool.description.matchAll(inputRegex)) {
      const key = match[1].replace('?', '')
      const value = match[2].trim()
      actionParams[key] = value
    }

    const handler = async (params: any) => {
      const input =
        Object.keys(params).length > 1
          ? JSON.stringify(params)
          : (Object.values(params)[0] as string)
      console.log('Handler input:', input)

      const response = await tool.invoke(input)
      return JSON.stringify(response)
    }

    actions[name] = {
      description: desc,
      actionParams,
      handler,
    }
  })
}

export default {
  init: async ({
    walletPrivateKey,
    rpcUrl,
  }: {
    walletPrivateKey: string
    rpcUrl: string
  }) => {
    await init({ walletPrivateKey, rpcUrl })
  },
  actions: actions,
}
