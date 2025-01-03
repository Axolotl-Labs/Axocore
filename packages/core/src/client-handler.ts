import axologger from './axologger'

const initClients = async (agent: any) => {
  for (const client of agent.clients) {
    try {
      axologger.info('Loading client: ', client)
      const module = await import('@axocore/client-' + client)
      if (module.default && typeof module.default === 'object') {
        let initData = {}
        switch (client) {
          case 'cmd':
            initData = {
              name: agent.name,
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
