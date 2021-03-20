import { combineReducers } from '@reduxjs/toolkit'
import { counterSlice } from './counter/counter-slice'

export const reducer = combineReducers({
  counter: counterSlice.reducer,
})

export const saga = () => {}
