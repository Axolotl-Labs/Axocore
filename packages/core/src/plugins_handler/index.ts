import axologger from '../axologger'
import { callAgent } from '../llm'

let actions: { [key: string]: any } = {}

const processAction = async (action: string, params: any) => {
  if (!actions[action]) {
    throw new Error(`Action ${action} not found`)
  }

  try {
    const res = await actions[action].handler(params)
    if (res) {
      callAgent({
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
  } catch (error) {
    console.error(`Error executing action ${action}:`, error)
    throw error
  }
}

const initPlugins = async (plugins: string[]) => {
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
        actions = { ...actions, ...module.default.actions }
      }
    } catch (error) {
      console.error(`Failed to load plugin: ${plugin}`, error)
    }
  }
  axologger.info('Actions :', JSON.stringify(Object.keys(actions)))
}

export { processAction, initPlugins }
