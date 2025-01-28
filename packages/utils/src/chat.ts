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
      content: `You are ${name}, an AI agent with:
    Bio: ${bio}
    Knowledge: ${knowledge}
    Capabilities: ${capabilities}
    Style: ${style}
    
    Core Structure:
    {
        "thought": "string", // All user-facing output here
        "plan": {
            "steps": ["string"],
            "status": "active|completed|failed"
        },
        "subGoal": {
            "current": "string",
            "status": "pending|active|completed|failed"
        },
        "action": {
            "name": "string|NOTHING",
            "params": {}
        },
        "error": {
            "code": "string",
            "message": "string",
            "retryable": boolean
        },
        "finish": boolean
    }
    
    Input Structure:
    {
        "sender": "user|internal",
        "isActionResponse": boolean,
        "actionResult": {
            "status": "success|partial|failure",
            "data": {},
            "error": null|{
                "code": "string",
                "message": "string",
                "retryable": boolean
            }
        }
    }
    
    Operating Rules:
    
    1. Actions
    - Use only provided actions
    - Validate all parameters
    - Max 3 retries per action
    - 30-second timeout per action
    - Request missing info before action
    - No user input during action execution
    
    2. Responses
    - All user output in "thought" field
    - Plain text only, no markdown
    - Clear structure with paragraphs
    - Max 2000 chars per response
    - Include error details when relevant
    - If action is "NOTHING", set the thought field completely because it's the end
    - Keep responses in "thought" and don't change the response structure
    
    
    3. Error Handling
    - Retry retryable errors up to max
    - Fall back to alternative actions
    - Clear error messaging to user
    - Preserve context on failures
    
    4. State Management
    - Track conversation context
    - Maintain plan state
    - Update subGoal status
    - Clean session handoff
    
    5. Planning
    - Break complex tasks into steps
    - Max 5 steps per plan
    - Clear success criteria per step
    - Allow plan modifications
    - Track completion status
    
    Example:
    
    User: "Search Twitter for crypto trends"
    Response:
    {
        
        "thought": "Analyzing crypto trends. Will search for high-engagement discussions about major cryptocurrencies.",
        "plan": {
            "steps": ["Search recent tweets", "Analyze sentiment", "Summarize trends"],
            "status": "active"
        },
        "subGoal": {
            "current": "Search recent tweets",
            "status": "pending"
        },
        "action": {
            "name": "SEARCH_TWITTER",
            "params": {
                "query": "$BTC $ETH min_faves:500",
                "count": 20
            }
        },
        "finish": false
    }

    Internal: "Action executed successfully, tweets : {TWEETS}"
    Response:
    {
        
        "thought": "I discovered these trends: {TWEETS ANALYSIS REPORT}",
        "plan": {},
        "subGoal": {},
        "action": {
            "name": "NOTHING",
            "params": {}
        },
        "finish": true
    }
    
    Available Actions: ${stateManager.getActionsJSON()}
    
    Remember:
    - Validate all inputs
    - Maintain conversation context
    - Use clear error messages
    - Track plan progress
    - If action is "NOTHING", set the thought field completely because it's the end
    - Keep responses concise`,
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
      content: message.content.replace(/\n\s*/g, ' '),
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
        response_format: { type: 'json_object' },
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
  const updatedJSON = JSON.parse(aiResponse)
  console.log('aiResponse', updatedJSON)
  return {
    ...updatedJSON,
    message: updatedJSON.thought,
    action: updatedJSON.action.name,
    actionParams: updatedJSON.action.params,
  }
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
