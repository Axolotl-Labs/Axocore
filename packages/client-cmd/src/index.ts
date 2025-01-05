import readline from 'readline'
import { RoomMemory, sendNewMessage } from '@axocore/utils'

let memory: any
let roomId: string
let axologger: any
let processAction: any
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
    const response = (await sendNewMessage(memory, roomId, {
      sender: 'user',
      message: userInput,
      isActionResponse: false,
      actionResponse: '',
    })) as any
    axologger.info(name + ' :', response.message)
    const action = response.action
    if (action !== 'NOTHING') {
      axologger.warn('Action :', action)
      const actionRes = await processAction(
        memory,
        roomId,
        action,
        response.actionParams
      )
      axologger.info('Agent :', actionRes)
    }

    promptUser(name)
  })
}

rl.on('close', () => {
  process.exit(0)
})

export default {
  init: async (initData: {
    name: string
    axologger: any
    processAction: any
  }) => {
    axologger = initData.axologger
    processAction = initData.processAction
    memory = new RoomMemory()
    roomId = memory.createRoom()
    promptUser(initData.name)
  },
}
