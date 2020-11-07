////////////////
// Mini-Redux //
////////////////

// (Follows instructions from here: https://zapier.com/engineering/how-to-build-redux/)

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
// 4) middleware() – decorator function that can provide i.e. async capabilities
//
export const createStore = (reducer, middleware) => {
  let state
  const subscribers = []

  const coreDispatch = action => {
    validateAction(action)
    state = reducer(state, action)
    subscribers.forEach(handler => handler())
  }

  const getState = () => state

  const store = {
    dispatch: coreDispatch,
    getState,
    subscribe: handler => {
      subscribers.push(handler)
      return () => {
        const index = subscribers.indexOf(handler)
        if (index > 0) {
          subscribers.splice(index, 1)
        }
      }
    },
  }

  if (middleware) {
    const dispatch = action => store.dispatch(action)
    store.dispatch = middleware({
      dispatch,
      getState,
    })(coreDispatch)
  }

  coreDispatch({ type: 'INIT' })
  return store
}

////////////////////////////////////////
// Multiple middleware implementation //
////////////////////////////////////////
// No-op
const identity = dispatch => dispatch

// Accumulates effect of array of functions
const accumulator = (acc, dispatch) => next => acc(dispatch(next))

// Applies any amount of middleware function to dispatch function
export const applyMiddleware = (...middlewares) => store => {
  if (middlewares.length === 0) {
    return identity
  }
  if (middlewares.length === 1) {
    return middlewares[0](store)
  }
  const boundMiddlewares = middlewares.map(middleware => middleware(store))
  return boundMiddlewares.reduce(accumulator)
}

/** Middleware example
 *  @example
 *  const delayMiddleware = )( => next => action => {
 *    setTimeout(() => {
 *      next(action)
 *    }, 1000)
 *  }
 */
