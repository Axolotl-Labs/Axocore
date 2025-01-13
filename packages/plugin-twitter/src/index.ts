// import axolog from '../utils/axolog'

import { axologger } from '@axocore/utils'
import { Scraper, SearchMode } from 'agent-twitter-client'
import fs from 'fs'
import path from 'path'

const scraper = new Scraper()
const __dirname = path.resolve() + '/.runtime'
const cookiefilename = 'twitter-cookies.json'
async function init({
  username,
  password,
  email,
}: {
  username: string
  password: string
  email: string
}) {
  if (!fs.existsSync(__dirname)) {
    fs.mkdirSync(__dirname)
  }
  await ensureAuthenticated({ username, password, email })
}

async function loginAndSaveCookies({
  username,
  password,
  email,
}: {
  username: string
  password: string
  email: string
}) {
  try {
    // Log in using credentials from environment variables
    await scraper.login(username, password, email)

    // Retrieve the current session cookies
    const cookies = await scraper.getCookies()

    // Save the cookies to a JSON file for future sessions
    fs.writeFileSync(
      path.resolve(__dirname, cookiefilename),
      JSON.stringify(cookies)
    )

    axologger.success('Logged in and cookies saved.')
  } catch (error) {
    console.error('Error during login:', error)
  }
}

async function loadCookies() {
  try {
    // Read cookies from the file system
    const cookiesData = fs.readFileSync(
      path.resolve(__dirname, cookiefilename),
      'utf8'
    )
    const cookiesArray = JSON.parse(cookiesData)

    // Map cookies to the correct format (strings)
    const cookieStrings = cookiesArray.map((cookie: any) => {
      return `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${
        cookie.path
      }; ${cookie.secure ? 'Secure' : ''}; ${
        cookie.httpOnly ? 'HttpOnly' : ''
      }; SameSite=${cookie.sameSite || 'Lax'}`
    })

    // Set the cookies for the current session
    await scraper.setCookies(cookieStrings)

    axologger.info('[@plugin-twitter]', 'Cookies loaded from file.')
  } catch (error) {
    axologger.error('Error loading cookies:', JSON.stringify(error))
  }
}

async function ensureAuthenticated({
  username,
  password,
  email,
}: {
  username: string
  password: string
  email: string
}) {
  if (fs.existsSync(path.resolve(__dirname, cookiefilename))) {
    await loadCookies()
    axologger.info(
      '[@plugin-twitter]',
      'You are already logged in. No need to log in again.'
    )
  } else {
    await loginAndSaveCookies({
      username,
      password,
      email,
    })
  }
}

const fetchtweets = async (query: any, count: any, searchMode: any) => {
  axologger.info(
    `Fetching tweets for query: ${query} with count: ${count} and search mode: ${searchMode}`
  )
  let tweets = []
  for await (const tweet of scraper.searchTweets(
    `${query} -filter:replies -filter:retweets -filter:links -filter:media`,
    count,
    searchMode === 'Top' ? SearchMode.Top : SearchMode.Latest
  )) {
    tweets.push(tweet)
  }

  const filtered = tweets
    .filter((tweet) => tweet.isReply == false)
    .map((tweet) => ({
      userId: tweet.userId,
      username: tweet.username,
      name: tweet.name,
      text: tweet.text,
      likes: tweet.likes,
      replies: tweet.replies,
      retweets: tweet.retweets,
    }))
  axologger.success(`Fetched ${filtered.length} tweets`)

  return JSON.stringify(filtered)
}
const fetchProfile = async (name: any, count: any) => {
  axologger.info(`Fetching profiles for name: ${name} with count: ${count} `)
  const profileResults = await scraper.fetchSearchProfiles(name, count)

  const filtered = profileResults.profiles.map((profile) => ({
    biography: profile.biography,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    isPrivate: profile.isPrivate,
    likesCount: profile.likesCount,
    listedCount: profile.listedCount,
    name: profile.name,
    tweetsCount: profile.tweetsCount,
    username: profile.username,
    isBlueVerified: profile.isBlueVerified,
    joined: profile.joined,
    website: profile.website,
    canDm: profile.canDm,
  }))

  return JSON.stringify(filtered)
}
const fetchProfileTweets = async (username: any, count: any) => {
  axologger.info(`Fetching tweets for ${username} with count: ${count}`)
  let tweets = []
  for await (const tweet of scraper.getTweets(username, count)) {
    tweets.push(tweet)
  }

  const filtered = tweets.map((tweet) => ({
    conversationId: tweet.conversationId,
    text: tweet.text,
    likes: tweet.likes,
    replies: tweet.replies,
    views: tweet.views,
    retweets: tweet.retweets,
  }))

  return JSON.stringify(filtered)
}
const fetchListTweets = async (listId: any, count: any) => {
  const listTweets = await scraper.fetchListTweets(listId, count)
  console.log(
    listTweets.tweets.map((tweet) => ({
      name: tweet.name,
      text: tweet.text,
      thread: tweet.thread,
      conversationId: tweet.conversationId,
      isreply: tweet.isReply,
    }))
  )
  console.log(listTweets.tweets.length)
  return JSON.stringify(listTweets)
}

export default {
  init: async ({ username, password, email }: any) => {
    await init({ username, password, email })
  },
  actions: {
    SEARCH_TWITTER: {
      description: 'Search Twitter with a query.',
      actionParams: {
        query:
          'The query you want to search, you can use all twitter search queries (-filter and etc). ',
        count: 'How many tweets do you need (maximum is 50).',
        searchMode: 'Search mode only these values (Users, Top, Latest)',
      },
      handler: async (params: any) => {
        let res = null
        if (params.query && params.count) {
          res = await fetchtweets(params.query, params.count, params.searchMode)
        }
        return res
      },
    },
    SEARCH_TWITTER_PROFILE: {
      description: 'Search Twitter profiles with a name.',
      actionParams: {
        name: 'The name of the profile you want to search.',
        count: 'How many profiles do you need (maximum is 50).',
      },
      handler: async (params: any) => {
        let res = null
        if (params.name && params.count) {
          res = await fetchProfile(params.name, params.count)
        }
        return res
      },
    },
    SEARCH_TWITTER_PROFILE_TWEETS: {
      description: 'Search Twitter profile tweets with a username.',
      actionParams: {
        username: 'The username of the profile you want to search.',
        count: 'How many tweets do you need (maximum is 50).',
      },
      handler: async (params: any) => {
        let res = null
        if (params.username && params.count) {
          res = await fetchProfileTweets(params.username, params.count)
        }
        return res
      },
    },
    GET_LIST_TWEETS: {
      description: 'Get list tweets with a list id.',
      actionParams: {
        listId: 'The list id you want to search.',
        count: 'How many tweets do you need (maximum is 50).',
      },
      handler: async (params: any) => {
        let res = null
        if (params.listId && params.count) {
          res = await fetchListTweets(params.listId, params.count)
        }
        return res
      },
    },
  },
}
