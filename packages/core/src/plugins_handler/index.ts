import { stateManager } from '@axocore/utils'
import { axologger } from '@axocore/utils'
import { callAgent } from '../llm'

const processAction = async (action: string, params: any) => {
  const actions = stateManager.getActions()
  if (!actions[action]) {
    throw new Error(`Action ${action} not found`)
  }

  try {
    const res = await actions[action].handler(params)
    let agnetResponse: any = {}
    if (res) {
      agnetResponse = await callAgent({
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
            initData = {
              username: process.env.TWITTER_USERNAME,
              password: process.env.TWITTER_PASSWORD,
              email: process.env.TWITTER_EMAIL,
            }
            break

          default:
            break
        }
        await module.default.init(initData)
        axologger.success(
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
  axologger.info('Actions:', JSON.stringify(stateManager.getActions()))
}

export { processAction, initPlugins }
