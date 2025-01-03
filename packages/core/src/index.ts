import { processAction, initPlugins } from './plugins_handler'
import axologger from './axologger'
import { callAgent } from './llm'

const agentWake = async (agent: {
  name: string
  provider: string
  model: string
  bio: any[]
  knowledge: any[]
  style: any[]
  plugins?: string[]
}) => {
  axologger.log('🌅 Agent is waking up... Initializing core systems.')

  if (agent.plugins && agent.plugins.length > 0) {
    axologger.log('🔮 Plugins detected. Preparing for magic...')
    await initPlugins(['@axocore/plugin-twitter'])
  }

  axologger.success('User : HI')
  const res = await callAgent('HI', 'user')
  axologger.success('Agent :', res.message)
}

export { initPlugins, processAction, axologger, agentWake }
