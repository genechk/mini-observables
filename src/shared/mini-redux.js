////////////////
// Mini-Redux //
////////////////

// Validate the received action is legit
const validateAction = action => {
  if (!action || typeof action !== 'object' || Array.isArray(action)) {
    throw new Error('Action must be an object')
  }
  if (typeof action.type === 'undefined') {
    throw new Error(
      'The only thing that action truly requires is type. Please do provide type.'
    )
  }
}

// Store implementation. Container for `state` object and `subscribers` array.
// Main methods:
// 1) dispatch – receives reducer and action. Dispatches it to all subscribers
// 2) getState() – returns current state
// 3) subscribe() – receives handler function and adds it to subscribers array.
//    returns `unsubscribe` function.
//
export const createStore = reducer => {
  let state
  const subscribers = []
  const store = {
    dispatch: action => {
      validateAction(action)
      state = reducer(state, action)
      subscribers.forEach(handler => handler())
    },
    getState: () => state,
    subscribe: handler => {
      subscribers.push(handler)
      console.log('Subscribed')
      return () => {
        subscribers.splice(subscribers.indexOf(handler), 1)
      }
    },
  }

  store.dispatch({ type: 'INIT' })
  return store
}
