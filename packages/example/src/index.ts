import 'dotenv/config'
import { agentWake } from '@axocore/core'

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

agentWake(agent)
