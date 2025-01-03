import axologger from '../axologger'

// Type definition for actions
type Actions = { [key: string]: any }

// Use global to store actions in memory
declare global {
  var sharedActions: Actions
}

// Initialize the sharedActions in global if not already initialized
if (!global.sharedActions) {
  global.sharedActions = {} // Set empty object initially
}

class SharedState {
  private actions: Actions

  constructor() {
    // Use global.sharedActions to retrieve the actions
    this.actions = global.sharedActions
  }

  // Get all actions from memory (global object)
  getActions(): Actions {
    return this.actions
  }

  // Add new actions to global store
  async addActions(newActions: Actions, plugin: string): Promise<void> {
    const currentActions = this.getActions()

    // Iterate over the new actions and add them if they don't already exist
    for (const [actionKey, action] of Object.entries(newActions)) {
      if (!currentActions[actionKey]) {
        // Add new action if it doesn't exist
        currentActions[actionKey] = { ...action, plugin }
        axologger.info(`Action ${actionKey} added successfully.`)
      } else {
        // Log that the action already exists
        axologger.info(`Action ${actionKey} already exists, skipping.`)
      }
    }

    // Since the actions are stored in global, we don't need to save them to a file
    global.sharedActions = currentActions // Directly update the global object
  }
}

// Export a singleton instance of the shared state
export const sharedState = new SharedState()
