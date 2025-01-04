import { axologger } from '@axocore/utils'
import { callAgent } from './llm'
import { processAction } from './plugins_handler'

const initClients = async (agent: any) => {
  for (const client of agent.clients) {
    try {
      axologger.info('[@core]', 'Loading client: ', client)
      const module = await import('@axocore/client-' + client)
      if (module.default && typeof module.default === 'object') {
        let initData = {}
        switch (client) {
          case 'cmd':
            initData = {
              name: agent.name,
              axologger,
              processAction,
              callAgent,
            }
            break

          default:
            break
        }
        await module.default.init(initData)
      }
    } catch (error) {
      console.error(`Failed to load plugin: ${client}`, error)
    }
  }
}

export { initClients }
