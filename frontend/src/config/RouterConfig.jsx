import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Admin from '../pages/Admin'
import Customer from '../pages/Customer'
import Login from '../pages/Login'
import Home from '../pages/Home'
import IncomingOrders from '../components/IncomingOrders'
import MyOrders from '../components/MyOrders'
import Logs from '../components/Logs'
function RouterConfig() {
    return (
        <Routes>
            <Route path='/admin' element={<Admin />} />
            <Route path='/' element={<Home />} />
            <Route path='/customer' element={<Customer />} />
            <Route path='/login' element={<Login />} />
            <Route path='/orders' element={<IncomingOrders />} />
            <Route path='/my-orders' element={<MyOrders />} />
            <Route path='/logs' element={<Logs />} />
        </Routes>
    )
}

export default RouterConfig