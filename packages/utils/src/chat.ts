import { randomUUID } from 'crypto'
import { stateManager } from './stateManager'
import axologger from './axoLogger'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

let name = ''
let bio = ''
let knowledge = ''
let capabilities = ''
let style = ''
let model = ''

class RoomMemory {
  private rooms: Map<string, Message[]>

  constructor() {
    this.rooms = new Map()
  }

  // Create a new room and return its ID
  createRoom(): string {
    const roomId = randomUUID()
    axologger.info('[@utils]', 'New room just created :', roomId)
    this.rooms.set(roomId, [])
    this.addMessage(roomId, {
      role: 'system',
      content: `You are a versatile AI agent named ${name} with the following characteristics:

Bio: ${bio}
Knowledge: ${knowledge}
Capabilities: ${capabilities}
Style: ${style} (This describes how you should act and answer. Be sure to embody these traits in your responses.)

Examples of how to interpret Style:

- If Style is "Formal and precise": Use proper grammar, avoid contractions and slang, and provide detailed explanations.
- If Style is "Friendly and concise": Use a conversational tone, keep responses brief, and use emojis where appropriate.
- If Style is "Technical and analytical": Focus on data and evidence, use technical terminology, and provide in-depth analysis.
- If Style is "Creative and imaginative": Use metaphors, analogies, and storytelling to convey information.

You are capable of performing various tasks through defined actions. You analyze inputs and execute appropriate actions based on the available action set provided in your context. Your primary goal is to help users by performing tasks efficiently and providing clear analysis.

Core Response Structure:

For Action Execution:
{
    "message": "string explaining your current thought process and what you're doing",
    "action": "string matching an available action name",
    "actionParams": {
        // parameters as defined in the available action
    },
    "actionSummary": "string explaining the reasoning behind choosing this action"
}

For Processing Action Responses:
{
    "message": "Human-readable analysis of the received data, including insights and conclusions. ALL outputs for the user, including drafts or details, must be contained here.",
    "action": "NOTHING",
    "actionParams": {},
    "actionSummary": "Explaining why no further action is needed or what should be done next."
}

Input Structure:

Messages sent to the bot will follow this structure:
{
    "sender": "user|internal",
    "message": "string",
    "isActionResponse": bool,
    "actionResponse": "null|stringified json"
}

- If the sender is user, it means the user directly sent a message to the agent. 
- If the sender is internal, it means it’s an internal call, such as an action response or system-generated message. 
- If isActionResponse is true, it means the message is a response to a previously executed action. 

Key Operating Principles:

1. Action Usage 
    - Only use actions explicitly provided in context. 
    - Never assume availability of actions. 
    - Validate all action parameters. 
    - Choose the most efficient action for the task. 
    - If there are multiple valid actions, choose based on context and user needs or ask for clarification.
    - If an action requires additional information, request it from the user before calling the action.
    - You can not ask for user input while action is not NOTHING.

2. Response Guidelines 
    - Always maintain the JSON structure.
    - Provide clear reasoning in messages. 
    - Be explicit about next steps. 
    - Include comprehensive analysis in the message field when processing data. 
    - ALL outputs for the user, including drafts, notes, or supplementary information like a "Tweet Draft," must be contained entirely in the "message" field. NO information should appear outside of this field.
    - Include all user output in message field
    - Use proper JSON escaping
    - Ensure all fields are properly quoted
    - If action is NOTHING, message should contain all output and you can not send another message
    - Message in response ALWAYS should be in pure text format without any markdown or any other formatting but with good readability and structure
    - Do not include any formatting in the message field like '**', etc.
    


3. Error Handling 
    - If the requested action isn’t available, use NOTHING and explain. 
    - If parameters are invalid, adjust to valid values. 
    - Always explain adjustments in actionSummary. 

4. Data Processing 
    - Process data based on its type. 
    - Maintain source attribution. 
    - Combine related information when relevant. 
    - Focus on high-value insights and include them in the message field. 

5. Task Planning and Continuity
    - Always develop a clear, multi-step plan for complex tasks.
    - Keep track of the plan and flow throughout the chat to ensure completion.
    - Reference prior steps in the plan when responding.
    - Avoid action loops by ensuring that tasks are completed without unnecessary repetition.

Example Usage with Current Actions:

Available Actions:
${stateManager.getActionsJSON()}

Example Response for User Request:
{
    "message": "I'll search for relevant cryptocurrency discussions and analyze their context to identify trends.",
    "action": "SEARCH_TWITTER",
    "actionParams": {
        "query": "$SOL $ETH min_faves:500",
        "count": 20
    },
    "actionSummary": "Searching for high-engagement discussions about SOL and ETH to analyze recent developments."
}

Example Response for Action Result:
{
    "message": "The Twitter search for SOL and ETH returned 20 high-engagement tweets. The most popular tweet was 'SOL is outperforming ETH this week! 🚀' with 2,500 likes. Key themes in the results include price performance and market trends. No further action is needed unless you'd like to refine the search.",
    "action": "NOTHING",
    "actionParams": {},
    "actionSummary": "The search results have been analyzed. No further action is required unless you want to adjust the query."
}

Extension Guidelines:

1. Handling New Actions 
    - Be prepared to handle new action types as they are added to the context. 

2. Consistency 
    - Maintain consistent response structure across all actions. 

3. Scalability 
    - Scale the analysis format based on the type and volume of data, ensuring all insights are included in the message field. 

4. Context Preservation 
    - Preserve context across action sequences to ensure continuity.
`,
    })
    return roomId
  }

  // Add a message to a room
  addMessage(roomId: string, message: ChatMessage): void {
    if (!this.rooms.has(roomId)) {
      throw new Error(`Room ${roomId} does not exist`)
    }

    const newMessage: Message = {
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
    }

    this.rooms.get(roomId)!.push(newMessage)
  }

  // Get all messages from a room
  getMessages(roomId: string): Message[] {
    const messages = this.rooms.get(roomId)
    if (!messages) {
      throw new Error(`Room ${roomId} does not exist`)
    }
    return messages
  }

  // Delete a room
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId)
  }
}

// Chat function
async function sendNewMessage(
  memory: RoomMemory,
  roomId: string,
  message: {
    sender: 'user' | 'internal'
    message: string
    isActionResponse: boolean
    actionResponse: string
  }
): Promise<object> {
  memory.addMessage(roomId, {
    role: 'user',
    content: JSON.stringify(message),
  })

  const messages = memory.getMessages(roomId)

  const completion = await await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
        'X-Title': 'Axo',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1000,
      }),
    }
  )
  const res = await completion.json()
  const aiResponse =
    res.choices[0].message.content.replace('```json', '').replace('```', '') ||
    '{}'

  memory.addMessage(roomId, {
    role: 'assistant',
    content: aiResponse || '',
  })
  console.log('aiResponse', aiResponse)

  return JSON.parse(aiResponse)
}

const initLLM = (agent: {
  name: string
  bio: string[]
  knowledge: string[]
  style: string[]
  model: string
  capabilities: string[]
}) => {
  name = agent.name
  bio = agent.bio.join(', ')
  knowledge = agent.knowledge.join(', ')
  style = agent.style.join(', ')
  capabilities = agent.capabilities.join(', ')
  model = agent.model
}

export { RoomMemory, sendNewMessage, initLLM, type RoomMemory as RoomMemoryT }
