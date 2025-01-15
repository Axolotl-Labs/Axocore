let apiKey: string = ''

const webSearch = async (params: any) => {
  const url = 'https://api.tavily.com/search'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        api_key: apiKey,
      }),
    })
    console.log(
      url,
      JSON.stringify({
        ...params,
        api_key: apiKey,
      }),
      JSON.stringify(response)
    )
    const res = await response.json()

    return JSON.stringify(res.results)
  } catch (error) {
    return new Error(`Error executing SEARCH_INTERNET: ${error}`)
  }
}

export default {
  init: async (initData: { apiKey: string }) => {
    apiKey = initData.apiKey
    console.log('init', apiKey)
  },
  actions: {
    SEARCH_INTERNET: {
      description: 'Search the internet for the query you provide.',
      actionParams: {
        query: 'The query you want to search for.',
        topic:
          'The category of the search. Currently: only "general" and "news" are supported. Default is "general".',
        days: 'The number of days back from the current date to include in the search results. This specifies the time frame of data to be retrieved. Please note that this feature is only available when using the "news" search topic. Default is 3 days.',
      },
      handler: async (params: any) => {
        const { query, topic = 'general', days = 3 } = params
        let res = null
        if (query) {
          res = await webSearch({ query, topic, days })
        }
        return res
      },
    },
  },
}
