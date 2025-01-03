import { axologger, callAgent, processAction, sharedState } from '@axocore/core'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function promptUser(name: string) {
  rl.question('Enter your message : ', async (input) => {
    const userInput = input.trim()
    process.stdout.moveCursor(0, -2)
    process.stdout.clearLine(1)
    process.stdout.moveCursor(0, 2)

    // call agent
    const response = await callAgent({
      sender: 'user',
      message: userInput,
      isActionResponse: false,
      actionResponse: '',
    })
    axologger.info(name + ' :', response.message)
    const action = response.action
    if (action !== 'NOTHING') {
      axologger.warn('Action :', action)
      const actionRes = await processAction(action, response.actionParams)
      axologger.info('Agent :', actionRes)
    }

    promptUser(name)
  })
}

rl.on('close', () => {
  process.exit(0)
})

export default {
  init: async (initData: { name: string }) => {
    console.log('Welcome to the echo program!')
    promptUser(initData.name)
  },
}
