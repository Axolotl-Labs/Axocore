import 'dotenv/config'
import { agentWake } from '@axocore/core'
import { stateManager } from '@axocore/utils'

const agent = {
  name: 'axobot',
  provider: 'openrouter',
  model: 'deepseek/deepseek-chat',
  bio: [],
  knowledge: [],
  style: [],
  plugins: ['@axocore/plugin-twitter'],
  clients: ['cmd'],
}

// stateManager.setState('aha', 'aha')
agentWake(agent)
