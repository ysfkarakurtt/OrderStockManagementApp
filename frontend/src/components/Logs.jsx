import axios from 'axios'
import React, { useEffect, useState } from 'react'

function Logs() {
    const [logs, setLogs] = useState([]);
    useEffect(() => {
        axios.get('http://localhost:8081/logs')
            .then((res) => {
                setLogs(res.data);
            })
            .catch((err) => {
                console.error(err)
            })
    }, [])
    return (
        <div style={{ marginTop: '150px' }}>
            <div className='container mt-5' >
                <table className='table table-striped'>
                    <thead className='thead-dark'>
                        <tr>
                            <th>ID</th>
                            <th>Müşteri ID</th>
                            <th>Sipariş ID</th>
                            <th>Tarih</th>
                            <th>Log Tipi</th>
                            <th>Detay</th>
                            <th>Ürün ID</th>
                        </tr>
                    </thead>
                    <tbody>

                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td>{log.id}</td>
                                <td>{log.customer_id}</td>
                                <td>{log.order_id}</td>
                                <td>{log.date}</td>
                                <td>{log.type}</td>
                                <td>{log.details}</td>
                                <td>{log.product_id}</td>
                            </tr>
                        ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Logs