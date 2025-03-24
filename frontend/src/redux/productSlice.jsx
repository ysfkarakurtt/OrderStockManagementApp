import { createSlice } from '@reduxjs/toolkit'
const initialState = {
    product: [],
    selectedProductID: -1
}
export const productSlice = createSlice({
    name: "product",
    initialState,
    reducers: {
        setProductID: (state, id) => {
            state.selectedProductID = id;

        }
    },
    extraReducers: (builder) => {

    }
})

export const { setProductID } = productSlice.actions
export default productSlice.reducer