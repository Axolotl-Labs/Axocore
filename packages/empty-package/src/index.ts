export default {
  init: async () => {
    console.log('init')
  },
  actions: {
    SEARCH_TWITTER: {
      description: 'Search Twitter with a query.',
      actionParams: {
        query:
          'The query you want to search, you can use all twitter search queries (-filter and etc). ',
        count: 'How many tweets do you need (maximum is 50).',
      },
      handler: async (params: any) => {
        console.log('search')
      },
    },
  },
}
