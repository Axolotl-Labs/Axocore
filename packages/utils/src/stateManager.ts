type Actions = { [key: string]: any }

declare global {
  var sharedActions: Actions
}

class stateManagerInstance {
  private actions: Actions

  constructor() {
    // Use global.sharedActions to retrieve the actions
    this.actions = global.sharedActions
  }

  getActions(): Actions {
    return this.actions || {}
  }

  getActionsJSON(): string {
    const actions = this.getActions()
    return JSON.stringify(actions, null, 2)
  }

  async addActions(newActions: Actions): Promise<void> {
    const currentActions = this.getActions()

    // Iterate over the new actions and add them if they don't already exist
    for (const [actionKey, action] of Object.entries(newActions)) {
      if (!currentActions[actionKey]) {
        // Add new action if it doesn't exist
        currentActions[actionKey] = action
        console.log(`Action ${actionKey} added successfully.`)
      } else {
        // Log that the action already exists
        console.log(`Action ${actionKey} already exists, skipping.`)
      }
    }

    // Since the actions are stored in global, we don't need to save them to a file
    this.actions = currentActions // Directly update the global object
  }
}

export const stateManager = new stateManagerInstance()
