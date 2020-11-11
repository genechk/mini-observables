import React, { createContext, Component } from 'react'
import { createStore, applyMiddleware } from './shared/mini-redux.js'
import { loggingMiddleware, thunkMiddleware } from './shared/middleware.js'
import { Provider, connect } from './shared/mini-react-redux.js'
import { api } from './shared/serverAPI.mock.js'
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
  notes: {},
  openNoteId: null,
  isLoading: false,
}

// Accepts `state` object and `action` function from the dispatcher.
// Returns new state object that gets old state and updates it
// according to the action type
// Requires to be initiated with thunkMiddleware to process async calls
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_NOTE: {
      if (!action.id) {
        return {
          ...state,
          isLoading: true,
        }
      }
      const newNote = {
        id: action.id,
        content: '',
      }
      return {
        ...state,
        isLoading: false,
        openNoteId: action.id,
        notes: {
          ...state.notes,
          [action.id]: newNote,
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

const store = createStore(
  reducer,
  applyMiddleware(thunkMiddleware, loggingMiddleware)
)

//////////////////////////
// Provider and connect //
//////////////////////////

const mapStateToProps = state => ({
  notes: state.notes,
  openNoteId: state.openNoteId,
})

const mapDispatchToProps = dispatch => ({
  onAddNote: () => dispatch(createNote()),
  onChangeNote: (id, content) =>
    dispatch({
      type: UPDATE_NOTE,
      id,
      content,
    }),
  onOpenNote: id =>
    dispatch({
      type: OPEN_NOTE,
      id,
    }),
  onCloseNote: () =>
    dispatch({
      type: CLOSE_NOTE,
    }),
})

// Action creator. Allows to abstract away code heavy actions
const createNote = () => {
  return dispatch => {
    dispatch({
      type: CREATE_NOTE,
    })
    api.createNote().then(({ id }) => {
      dispatch({
        type: CREATE_NOTE,
        id,
      })
    })
  }
}

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
const NoteAppContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(NoteApp)

export const MiniRedux = () => {
  return (
    <Provider store={store}>
      <NoteAppContainer />
    </Provider>
  )
}
