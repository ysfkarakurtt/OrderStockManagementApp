import React, { useState } from 'react'
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import axios from 'axios';
function MyOrders() {
    const { login_id } = useSelector((store) => store.login);
    const [myOrders, setMyOrders] = useState([]);
    const logID = login_id.payload;
   
    const fetchMyOrders = async () => {

        await axios.post('http://localhost:8081/my-orders', { logID })
            .then((res) => {
                setMyOrders(res.data.results);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        fetchMyOrders();

    }, []);
    return (

        <div className='orders-container'>
            <div className='my-orders'>
                <h2 className='title'>Siparişlerim</h2>
                <div>
                    <table className='table table-striped'>
                        <thead className='thead-dark'>
                            <tr>
                                <th>Ürün ID</th>
                                <th>Adet</th>
                                <th>Toplam Fiyat</th>
                                <th>Tarih</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myOrders && myOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.product_id}</td>
                                    <td>{order.quantity}</td>
                                    <td>{order.total_price}</td>
                                    <td>{order.date}</td>
                                    <td>{order.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}

export default MyOrders