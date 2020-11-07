// Logging middleware for mini-redux
export const loggingMiddleware = ({ getState }) => next => action => {
  console.info('Before:', getState())
  console.info('Action:', action)

  const result = next(action)
  console.info('After:', getState())
  return result
}

/** Thunk middleware (wrapper for some work that needs to be done
 *  later)
 *  How to use Thunk:
 *  @example
 *
 *  store.dispatch((getState, dispatch) => {
 *    // Grab something from the state
 *    const someId = getState().someId;
 *    // Fetch something that depends on knowing that something
 *    fetchSomething(someId)
 *      .then( something => {
 *        // Dispatch after all done
 *        dispatch({
 *          type: 'someAction',
 *          something
 *        })
 *      })
 *  })
 */
export const thunkMiddleware = ({
  dispatch,
  getState,
}) => next => action => {
  if (typeof action === 'function') {
    return action(dispatch, getState)
  }
  return next(action)
}
