/** Provider and connect components
 *  Created per series of articles on react-redux
 *  Part 1: https://medium.com/netscape/implementation-of-react-redux-part-1-411b971a9b5b
 *  Part 2: https://medium.com/@kj_huang/implementation-of-react-redux-part-2-633441bd3306
 *  Part 3: https://medium.com/@kj_huang/implementation-of-react-redux-part-3-dc54fce9746a
 */
import React, { Component } from 'react'
import PropTypes from 'prop-types'

const storeShape = PropTypes.shape({
  subscribe: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  getState: PropTypes.func.isRequired,
})

const subscriptionShape = PropTypes.shape({
  trySubscribe: PropTypes.func.isRequired,
  notifyNestedSubs: PropTypes.func.isRequired,
})

// Some optimizations can be stored here
export function connect(mapStateToProps, mapDispatchToProps) {
  return connectHOC(mapStateToProps, mapDispatchToProps)
}

export class Provider extends Component {
  constructor(props, context) {
    super(props, context)
    this.store = props.store
  }

  getChildContext() {
    return { store: this.store, parentSub: null }
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

Provider.childContextTypes = {
  store: storeShape,
  parentSub: subscriptionShape,
}

// Higher order component for react-redux connect clone
function connectHOC(mapStateToProps, mapDispatchToProps) {
  return function wrapWithConnect(WrappedComponent) {
    class Connect extends Component {
      constructor(props, context) {
        super(props, context)
        // Get store from context
        this.store = context.store
        this.initSelector()
        // Get parent’s subscription from context
        const parentSub = context.parentSub
        // Init own subscription based on parent subscription
        this.subscription = new Subscription(
          this.store,
          parentSub,
          this.onStateChange.bind(this)
        )
      }

      getChildContext() {
        // Replace parentSub context for the child component with its own Subscription instance
        return {
          parentSub: this.subscription,
        }
      }
      componentDidMount() {
        this.subscription.trySubscribe()
      }
      initSelector() {
        const selector = selectorFactory(
          this.store.dispatch,
          mapStateToProps,
          mapDispatchToProps
        )
        this.selector = makeSelectorStateful(selector, this.store)
        // init selector.props for initial render
        this.selector.run(this.props)
      }
      // Data source 1. Updates selectorProps when state changes
      onStateChange() {
        this.selector.run(this.props)
        if (!this.selector.shouldComponentUpdate) {
          // If component itself doesn’t need to update we still need
          // to notify nested subscriptions
          this.subscription.notifyNestedSubs()
        } else {
          this.componentDidUpdate = this.notifyNestedSubsOnComponentDidUpdate
          this.setState({})
        }
      }
      // Resets componentDidUpdate to undefined, then does the selector job
      notifyNestedSubsOnComponentDidUpdate() {
        // Set to undefined to avoid notification due to normal update (i.e. parent re-render)
        this.componentDidUpdate = undefined
        this.subscription.notifyNestedSubs()
      }
      // Data source 2. updates selectorProps when component’s own props change
      componentWillReceiveProps(nextProps) {
        // Run selector to update selector.props
        this.selector.run(nextProps)
      }
      shouldComponentUpdate() {
        // Rely on stateful selector to avoid unnecessary re-render
        return this.selector.shouldComponentUpdate
      }

      render() {
        // Container’s job is to inject merged props from selector into WrappedComponent
        const selector = this.selector
        selector.shouldComponentUpdate = false
        // Get the merged props from the selector
        return React.createElement(WrappedComponent, selector.props)
      }
    }
    // The context exposed to container itself
    Connect.contextTypes = {
      store: storeShape,
      parentSub: subscriptionShape,
    }
    // Replace the context of parentSub for the child component
    Connect.childContextTypes = {
      parentSub: subscriptionShape,
    }
    return Connect
  }
}

// Subscription handler. Uses trySubscribe() to conditionally subscribe to store
// if `subscribed` is not true
class Subscription {
  constructor(store, parentSub, onStateChange) {
    this.store = store
    this.parentSub = parentSub
    // Listener
    this.onStateChange = onStateChange
    // Flag to check wheter itself has been subscribed
    this.subscribed = false
    // Listeners of all nested subscriptions go here
    this.listeners = []
  }
  // Notify subscribed listeners
  notifyNestedSubs() {
    this.listeners.forEach(listener => listener())
  }
  // Subscribe if everything is in order
  trySubscribe() {
    if (!this.subscribed) {
      if (this.parentSub !== null) {
        // Subscribe to parent if parent subscription exists
        this.parentSub.addNestedSub(this.onStateChange)
      } else {
        // Root components subscribe durrectly to store
        this.store.subscribe(this.onStateChange)
      }
      // Mark itself subscribed
      this.subscribed = true
    }
  }
  // Nest child subscription within itself
  addNestedSub(listener) {
    // 1. Ensure that component itself is subscribed (maintains correct order)
    this.trySubscribe()
    // 2. Subscribe the nested listener to its own listener collection
    this.listeners.push(listener)
  }
}

// The factory function that creates optimized selector based on mapping function
// and store.dispatch method. The return selector can then use the mapping function
// to convert the nextState and ownProps to mergedProps
function selectorFactory(dispatch, mapStateToProps, mapDispatchToProps) {
  // 1. Cache the direct input for the selector
  // Store state
  let state
  // Container’s own props
  let ownProps

  // 2. Cache the intermediate results from mapping functions
  // The derived props from the state
  let stateProps
  // The derived props from store.dispatch
  let dispatchProps
  let dispatchMappedOnce = false

  // 3. Cache the output
  // Returned mergedProps (stateProps + dispatchProps + ownProps) to be injected into wrappedComponent
  let mergedProps

  // Memorizable source selector
  return function selector(nextState, nextOwnProps) {
    // Before running the actual mapping function, compare its arguments with the previous ones
    const propsChanged = !shallowEqual(nextOwnProps, ownProps)
    const stateChanged = !strictEqual(nextState, state)

    state = nextState
    ownProps = nextOwnProps

    // Calculate mergedProps based on different scenarios
    // This minimizes the call to actual functions that calculate the result mapping fs and mergeProps)
    // Note that mapping functions can be optimized with Reselect library

    // Case 1: both state and props change
    if (propsChanged && stateChanged) {
      // Derive new props based on state
      stateProps = mapStateToProps(state, ownProps)
      // Check if mapDispatchToProps depends on props at all, if it does update it
      if (mapDispatchToProps.length !== 1 || !dispatchMappedOnce) {
        dispatchProps = mapDispatchToProps(dispatch, ownProps)
        // Allows mapDispatchToProps to run at least once
        dispatchMappedOnce = true
      }
      // Merge the props
      mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
      return mergedProps
    }

    // Case 2: only own props change
    if (propsChanged) {
      // Only update stateProps and dispatchProps if they rely on ownProps
      if (mapStateToProps.length !== 1) {
        stateProps = mapStateToProps(state, ownProps)
      }
      if (mapDispatchToProps.length !== 1) {
        dispatchProps = mapDispatchToProps(dispatch, ownProps)
      }
      // Merge the props
      mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
      return mergedProps
    }

    // Case 3: only state change
    if (stateChanged) {
      const nextStateProps = mapStateToProps(state, ownProps)
      const statePropsChanged = !shallowEqual(nextStateProps, stateProps)
      stateProps = nextStateProps
      // If state props changed update merged props
      if (statePropsChanged) {
        mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
      }
      return mergedProps
    }

    // Case 4: no change. Return cached result
    return mergedProps
  }
}

// Stateful = use memoization techniques to check wheter React component should update
function makeSelectorStateful(selector, store) {
  // Wrap selector in the component-like object that tracks its results bw runs
  const statefulSelector = {
    run: function (props) {
      const nextProps = selector(store.getState(), props)
      // set shouldComponentUpdate flag to true if new props don’t match previous
      if (nextProps !== statefulSelector.props) {
        // Update flag and props for React
        statefulSelector.shouldComponentUpdate = true
        statefulSelector.props = nextProps
      }
    },
  }
  return statefulSelector
}

// Utility functions
const hasOwn = Object.prototype.hasOwnProperty

function is(x, y) {
  if (x === y) {
    // Handles -0 correctly
    return x !== 0 || y !== 0 || 1 / x === 1 / y
  } else {
    // Handles NaN case
    return x !== x && y !== y
  }
}

function shallowEqual(objA, objB) {
  if (is(objA, objB)) return true

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  for (let i = 0; i < keysA.length; i++) {
    if (
      !hasOwn.call(objB, keysA[i]) ||
      !is(objA[keysA[i]], objB[keysB[i]])
    ) {
      return false
    }
  }

  return true
}

function strictEqual(a, b) {
  return a === b
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return { ...ownProps, ...stateProps, ...dispatchProps }
}
