import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/CustomerList.css';
import { useNavigate } from 'react-router-dom';

function CustomerList() {

    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const generateRandomCustomers = () => {
        const customerCount = Math.floor(Math.random() * 6) + 5;
        const customers = [];
        const types = ['standard', 'premium'];
        for (let i = 0; i < customerCount; i++) {

            const id = i + 1;
            const name = `Müşteri ${id}`;
            const password = `${id}`;
            const budget = Math.floor(Math.random() * 2501) + 500;
            const type = i < 2 ? 'premium' : types[Math.floor(Math.random() * types.length)];
            customers.push({ name, password, budget, type, totalSpent: 0 });
        }
        return customers;
    };

    const deleteAllCustomers = async () => {
        try {
            await axios.post('http://localhost:8081/delete-customers',);
            navigate(0);
        }
        catch (error) {
            setError("Müşteri silinirken hata oluştu.");
        }
    }

    const handleGenerateAndSaveCustomers = async () => {
        setLoading(true);
        setError(null);

        try {
            await deleteAllCustomers();
            const randomCustomers = generateRandomCustomers();
            setCustomers(randomCustomers);

            await axios.post('http://localhost:8081/customers', randomCustomers);
            navigate(0);
        } catch (error) {
            setError("Müşteri işlemleri sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        axios.get('http://localhost:8081/customers')
            .then(response => {
                setCustomers(response.data);
                setLoading(false);
            })
            .catch(error => {
                setError("Müşteri listesi yüklenirken bir hata oluştu.");
                setLoading(false);
            });
    }, []);

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Müşteri Listesi</h2>
            <button className="btn btn-primary mb-4 " onClick={handleGenerateAndSaveCustomers}> Yeni Müşterileri Oluştur ve Kaydet </button>
            {loading ? (
                <div className="alert alert-info text-center" role="alert">
                    Yükleniyor...
                </div>
            ) : error ? (
                <div className="alert alert-danger text-center" role="alert">
                    {error}
                </div>
            ) : (
                <table className="table table-striped">
                    <thead className="thead-dark">
                        <tr>
                            <th>ID</th>
                            <th>Ad</th>
                            <th>Bütçe</th>
                            <th>Tür</th>
                            <th>Toplam Harcama</th>
                            <th>Bekleme Süresi</th>
                            <th>Öncelik Skoru</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id}>
                                <td>{customer.id}</td>
                                <td>{customer.name}</td>
                                <td>{customer.budget}</td>
                                <td>{customer.type}</td>
                                <td>{customer.total_spent}</td>
                                <td>{customer.waiting_time}</td>
                                <td>{customer.priority_score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default CustomerList;
