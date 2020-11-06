import React, { Component } from 'react'
import PropTypes from 'prop-types'

export class Provider extends Component {
  getChildContext() {
    return {
      store: this.props.store,
    }
  }

  render() {
    return this.props.children
  }
}

Provider.childContextTypes = {
  store: PropTypes.object,
}

export const connect = (
  mapStateToProps = () => {},
  mapDispatchToProps = () => {}
) => ConnectComponent => {
  class Connected extends Component {
    onStoreOrPropsChange(props) {
      const { store } = this.context
      const state = store.getState()
      const stateProps = mapStateToProps(state, props)
      const dispatchProps = mapDispatchToProps(store.dispatch, props)
      this.setState({
        ...stateProps,
        ...dispatchProps,
      })
    }

    componentWillMount() {
      const { store } = this.context
      this.onStoreOrPropsChange(this.props)
      this.unsubscribe = store.subscribe(() =>
        this.onStoreOrPropsChange(this.props)
      )
    }

    componentWillReceiveProps(nextProps) {
      this.onStoreOrPropsChange(nextProps)
    }

    componentWillUnmount() {
      this.unsubscribe()
    }

    render() {
      return <ConnectComponent {...this.props} {...this.state} />
    }
  }

  Connected.contextTypes = {
    store: PropTypes.object,
  }

  return Connected
}
