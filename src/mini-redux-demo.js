import React, { Component } from 'react'
import { createStore } from './shared/mini-redux.js'
import {
  CREATE_NOTE,
  UPDATE_NOTE,
  OPEN_NOTE,
  CLOSE_NOTE,
} from './shared/action-types.js'

//////////////////////
// Reducer function //
//////////////////////

const initialState = {
  nextNoteId: 1,
  notes: {},
  openNoteId: null,
}

// Accepts `state` object and `action` function from the dispatcher.
// Returns new state object that gets old state and updates it
// according to the action type
const reducer = (state = initialState, action) => {
  console.log(action.type)
  switch (action.type) {
    case CREATE_NOTE: {
      const id = state.nextNoteId
      const newNote = {
        id,
        content: '',
      }
      return {
        ...state,
        nextNoteId: id + 1,
        openNoteId: id,
        notes: {
          ...state.notes,
          [id]: newNote,
        },
      }
    }
    case UPDATE_NOTE: {
      const { id, content } = action
      const editedNote = {
        ...state.notes[id],
        content,
      }
      return {
        ...state,
        notes: {
          ...state.notes,
          [id]: editedNote,
        },
      }
    }
    case OPEN_NOTE: {
      return {
        ...state,
        openNoteId: action.id,
      }
    }
    case CLOSE_NOTE: {
      return {
        ...state,
        openNoteId: null,
      }
    }
    default: {
      return state
    }
  }
}

//////////////////
// Create store //
//////////////////

const store = createStore(reducer)

////////////////
// Components //
////////////////

// Note Editor Component.
// Opens when openNoteId has value (not null)
// Calls `onChangeNote` on `textarea` onChange event
// and `onCloseNote` after button is pressed
const NoteEditor = ({ note, onChangeNote, onCloseNote }) => (
  <div>
    <div>
      <textarea
        className="editor-content"
        autoFocus
        value={note.content}
        onChange={event => onChangeNote(note.id, event.target.value)}
      />
    </div>
    <button className="editor-button" onClick={onCloseNote}>
      Close
    </button>
  </div>
)

// Processes npte content and returns the title or `Untitled`
const NoteTitle = ({ note }) => {
  const title = note.content.split('\n')[0].replace(/^\s+|\s+$/g, '')
  if (title === '') {
    return <i>Untitled</i>
  }
  return <span>{title}</span>
}

const NoteLink = ({ note, onOpenNote }) => (
  <li className="note-list-item">
    <a href="#" onClick={() => onOpenNote(note.id)}>
      <NoteTitle note={note} />
    </a>
  </li>
)

const NoteList = ({ notes, onOpenNote }) => (
  <ul className="note-list">
    {Object.keys(notes).map(id => (
      <NoteLink key={id} note={notes[id]} onOpenNote={onOpenNote} />
    ))}
  </ul>
)

// Putting it all together
const NoteApp = ({
  notes,
  openNoteId,
  onAddNote,
  onChangeNote,
  onOpenNote,
  onCloseNote,
}) => (
  <div>
    {openNoteId ? (
      <NoteEditor
        note={notes[openNoteId]}
        onChangeNote={onChangeNote}
        onCloseNote={onCloseNote}
      />
    ) : (
      <div>
        <NoteList notes={notes} onOpenNote={onOpenNote} />
        <button className="editor-button" onClick={onAddNote}>
          Create Note
        </button>
      </div>
    )}
  </div>
)

// Component, assemble
export class NoteAppContainer extends Component {
  constructor(props) {
    super(props)
    this.state = props.store.getState()
    this.onAddNote = this.onAddNote.bind(this)
    this.onChangeNote = this.onChangeNote.bind(this)
    this.onOpenNote = this.onOpenNote.bind(this)
    this.onCloseNote = this.onCloseNote.bind(this)
  }

  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.setState(this.props.store.getState())
    })
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  onAddNote() {
    console.log('CREATE_NOTE action triggering')
    this.props.store.dispatch({
      type: CREATE_NOTE,
    })
  }

  onChangeNote(id, content) {
    console.log('UPDATE_NOTE action triggering')
    this.props.store.dispatch({
      type: UPDATE_NOTE,
      id,
      content,
    })
  }

  onOpenNote(id) {
    console.log('OPEN_NOTE action triggering')
    this.props.store.dispatch({
      type: OPEN_NOTE,
      id,
    })
  }

  onCloseNote() {
    console.log('CLOSE_NOTE action triggering')
    this.props.store.dispatch({
      type: CLOSE_NOTE,
    })
  }

  render() {
    return (
      <NoteApp
        {...this.state}
        onAddNote={this.onAddNote}
        onChangeNote={this.onChangeNote}
        onOpenNote={this.onOpenNote}
        onCloseNote={this.onCloseNote}
      />
    )
  }
}

export const MiniRedux = () => {
  return <NoteAppContainer store={store} />
}
