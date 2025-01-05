import { axologger } from '@axocore/utils'
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
            }
            break
          case 'telegram':
            if (!process.env.TELGRAM_BOT_TOKEN) {
              throw new Error('TELGRAM_BOT_TOKEN not found in .env')
            }
            if (!process.env.TELEGRAM_ADMIN_ID) {
              throw new Error('TELEGRAM_ADMIN_ID not found in .env')
            }
            initData = {
              name: agent.name,
              axologger,
              processAction,
              token: process.env.TELGRAM_BOT_TOKEN,
              adminId: parseInt(process.env.TELEGRAM_ADMIN_ID),
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
