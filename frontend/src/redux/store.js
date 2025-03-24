import { configureStore } from '@reduxjs/toolkit'
import loginReducer from '../redux/loginSlice'
import appReducer from '../redux/appSlice'
import productReducer from '../redux/productSlice'
import basketReducer from '../redux/basketSlice'
export const store = configureStore({
    reducer: {
        login: loginReducer,
        app: appReducer,
        product: productReducer,
        basket: basketReducer

    }
})