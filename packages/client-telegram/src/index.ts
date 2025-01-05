import { RoomMemory, sendNewMessage } from '@axocore/utils'
import TelegramBot, { Message } from 'node-telegram-bot-api'

let memory: any
let roomId: string
let axologger: any
let processAction: any

const init = async (name: string, token: string, adminId: number) => {
  const bot = new TelegramBot(token, { polling: true })

  bot.onText(/\/start/, (msg: Message) => {
    const chatId = msg.chat.id
    roomId = memory.createRoom()
    bot.sendMessage(
      chatId,
      'Welcome to AxoCore, the bot is ready your room id is ' + roomId
    )
  })

  bot.on('message', async (msg: Message) => {
    if (!msg.text) {
      return
    }

    if (msg.text === '/start') {
      return
    }
    if (roomId === undefined) {
      bot.sendMessage(msg.chat.id, 'Please /start the bot first')
      return
    }
    if (msg.chat.id !== adminId) {
      return
    }

    axologger.info('Message :', msg.text)
    const text = msg.text || ''
    const chatId = msg.chat.id

    // call agent
    const response = (await sendNewMessage(memory, roomId, {
      sender: 'user',
      message: text,
      isActionResponse: false,
      actionResponse: '',
    })) as any
    bot.sendMessage(chatId, response.message)
    const action = response.action
    if (action !== 'NOTHING') {
      axologger.warn('Action :', action)
      const actionRes = await processAction(
        memory,
        roomId,
        action,
        response.actionParams
      )
      bot.sendMessage(chatId, actionRes)
    }
  })
}

export default {
  init: async (initData: {
    name: string
    axologger: any
    processAction: any
    token: string
    adminId: number
  }) => {
    axologger = initData.axologger
    processAction = initData.processAction
    memory = new RoomMemory()

    init(initData.name, initData.token, initData.adminId)
  },
}
