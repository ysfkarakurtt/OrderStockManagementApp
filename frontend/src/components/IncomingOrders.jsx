import axios from 'axios';
import React, { useEffect, useState } from 'react';
import '../css/IncomingOrders.css';

function IncomingOrders() {
  
    const [waitingOrders, setWaitingOrders] = useState([]);
    const [approvedOrders, setApprovedOrders] = useState([]);

    const fetchWaitingOrders = () => {
        axios.get('http://localhost:8081/orders')
            .then((res) => {
                setWaitingOrders(res.data.results);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const fetchApprovedOrders = () => {
        axios.get('http://localhost:8081/approved-orders')
            .then((res) => {
                setApprovedOrders(res.data.results);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const approveAllOrders = () => {
        axios.post('http://localhost:8081/approve-orders')
            .then((res) => {
                alert(res.data.message || "Tüm siparişler başarıyla onaylandı.");
                fetchWaitingOrders(); 
            })
            .catch((err) => {
                alert("Sipariş onaylanırken bir hata oluştu.");
            });
    };

    useEffect(() => {
        fetchWaitingOrders();
        fetchApprovedOrders();
    }, []);

    return (
        <div className='orders-container'>
            <div className='waiting-orders'>
                <h2 className='title'>Onay Bekleyen Siparişler</h2>
                <button className='btn btn-primary' onClick={approveAllOrders}>
                    Tüm Siparişleri Onayla
                </button>
                <div>
                    <table className='table table-striped'>
                        <thead className='thead-dark'>
                            <tr>
                                <th>Müşteri ID</th>
                                <th>Ürün ID</th>
                                <th>Miktar</th>
                                <th>Toplam Fiyat</th>
                                <th>Tarih</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {waitingOrders && waitingOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.customer_id}</td>
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
            <div className='approved-orders'>
                <h2 className='title'>Onaylanmış Siparişler</h2>
                <div>
                    <table className='table table-striped'>
                        <thead className='thead-dark'>
                            <tr>
                                <th>Müşteri ID</th>
                                <th>Ürün ID</th>
                                <th>Miktar</th>
                                <th>Toplam Fiyat</th>
                                <th>Tarih</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedOrders && approvedOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.customer_id}</td>
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
    );
}

export default IncomingOrders;
