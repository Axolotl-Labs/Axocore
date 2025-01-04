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

const fetchtweets = async (query: any, count: any) => {
  axologger.info(`Fetching tweets for query: ${query} with count: ${count}`)
  let tweets = []
  for await (const tweet of scraper.searchTweets(
    `${query} -filter:media -filter:retweets -filter:replies`,
    count,
    SearchMode.Top
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
      },
      handler: async (params: any) => {
        let res = null
        if (params.query && params.count) {
          res = await fetchtweets(params.query, params.count)
        }
        return res
      },
    },
  },
}
