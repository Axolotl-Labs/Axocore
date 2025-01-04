import { processAction, initPlugins } from './plugins_handler'
import { axologger } from '@axocore/utils'
import { callAgent } from './llm'
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
  axologger.log(
    '[@core]',
    '🌅 Agent is waking up... Initializing core systems.'
  )

  if (agent.plugins && agent.plugins.length > 0) {
    axologger.log('[@core]', '🔮 Plugins detected. Preparing for magic...')
    await initPlugins(['@axocore/plugin-twitter'])
  }

  if (agent.clients && agent.clients.length > 0) {
    axologger.log(
      '[@core]',
      '📞 Client detected. Preparing for user interaction...'
    )
    await initClients(agent)
  }
}

export { axologger, agentWake, callAgent, processAction }
