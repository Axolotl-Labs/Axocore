import { processAction, initPlugins } from './plugins_handler'
import { axologger, initLLM } from '@axocore/utils'
import { initClients } from './client-handler'

const agentWake = async (agent: {
  name: string
  provider: string
  model: string
  bio: any[]
  knowledge: any[]
  style: any[]
  clients: string[]
  plugins?: string[]
}) => {
  console.clear()
  axologger.info(
    '[@core]',
    '🌅 Agent is waking up... Initializing core systems.'
  )
  axologger.info('[@core]', '🧠 Preparing for knowledge transfer...')
  initLLM(agent)

  if (agent.plugins && agent.plugins.length > 0) {
    axologger.info('[@core]', '🔮 Plugins detected. Preparing for magic...')
    await initPlugins(agent.plugins)
  }

  if (agent.clients && agent.clients.length > 0) {
    axologger.info(
      '[@core]',
      '📞 Client detected. Preparing for user interaction...'
    )
    await initClients(agent)
  }
}

export { axologger, agentWake, processAction }
