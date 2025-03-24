import { createSlice } from '@reduxjs/toolkit'


const savedLoginID = localStorage.getItem('login_id')
    ? JSON.parse(localStorage.getItem('login_id'))
    : -1;


const initialState = {
    login_id: savedLoginID, 

}

export const loginSlice = createSlice({
    name: "login",
    initialState,
    reducers: {
        setLoginID: (state, id) => {
            state.login_id = id; 
            localStorage.setItem('login_id', JSON.stringify(id)); 
        }

    },
})

export const { setLoginID } = loginSlice.actions
export default loginSlice.reducer
