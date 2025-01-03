import 'dotenv/config'
import { agentWake, axologger, initPlugins } from '@axocore/core'

const agent = {
  name: 'axobot',
  provider: 'openrouter',
  model: 'deepseek/deepseek-chat',
  bio: [],
  knowledge: [],
  style: [],
  plugins: ['@axocore/plugin-twitter'],
  client: ['api'],
}

agentWake(agent)
