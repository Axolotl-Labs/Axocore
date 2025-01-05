import {
  axologger,
  RoomMemory,
  sendNewMessage,
  stateManager,
} from '@axocore/utils'

const processAction = async (
  memory: RoomMemory,
  roomId: string,
  action: string,
  params: any
) => {
  const actions = stateManager.getActions()
  if (!actions[action]) {
    throw new Error(`Action ${action} not found`)
  }

  try {
    const res = await actions[action].handler(params)
    let agnetResponse: any = {}
    if (res) {
      agnetResponse = await sendNewMessage(memory, roomId, {
        sender: 'internal',
        message: 'Action executed successfully',
        isActionResponse: true,
        actionResponse: JSON.stringify({
          action,
          actionParams: params,
          response: res,
        }),
      })
    }
    return agnetResponse.message
  } catch (error) {
    console.error(`Error executing action ${action}:`, error)
    throw error
  }
}

const initPlugins = async (plugins: string[]) => {
  stateManager.addActions({
    NOTHING: {
      description: 'Do nothing, use it when no action is needed.',
      actionParams: {},
    },
  })

  for (const plugin of plugins) {
    try {
      const module = await import(plugin)

      if (module.default && typeof module.default === 'object') {
        let initData = {}
        switch (plugin) {
          case '@axocore/plugin-twitter':
            if (!process.env.TWITTER_USERNAME) {
              throw new Error('TWITTER_USERNAME not found')
            }
            if (!process.env.TWITTER_PASSWORD) {
              throw new Error('TWITTER_PASSWORD not found')
            }
            if (!process.env.TWITTER_EMAIL) {
              throw new Error('TWITTER_EMAIL not found')
            }
            initData = {
              username: process.env.TWITTER_USERNAME,
              password: process.env.TWITTER_PASSWORD,
              email: process.env.TWITTER_EMAIL,
            }
            break
          case '@axocore/plugin-solana-agent-kit':
            if (!process.env.SOLANA_WALLET_PRIVATE_KEY) {
              throw new Error('SOLANA_WALLET_PRIVATE_KEY not found')
            }
            if (!process.env.SOLANA_RPC_URL) {
              throw new Error('SOLANA_RPC_URL not found')
            }
            initData = {
              walletPrivateKey: process.env.SOLANA_WALLET_PRIVATE_KEY,
              rpcUrl: process.env.SOLANA_RPC_URL,
            }
            break

          default:
            break
        }
        await module.default.init(initData)
        axologger.success(
          '[@core]',
          `Plugin ${plugin} loaded successfully`,
          JSON.stringify(initData)
        )
        if (module.default.actions) {
          await stateManager.addActions(module.default.actions)
        }
      }
    } catch (error) {
      console.error(`Failed to load plugin: ${plugin}`, error)
    }
  }
  axologger.info(
    '[@core]',
    'Actions:',
    JSON.stringify(Object.keys(stateManager.getActions()))
  )
}

export { processAction, initPlugins }
