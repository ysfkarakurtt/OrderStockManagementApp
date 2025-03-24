import React, { useEffect, useState } from 'react';
import '../css/Admin.css';
import CustomerList from '../components/CustomerList';
import ProductList from '../components/ProductList';

function Admin() {

    return (
        <div className="container mt-5">
            
            <h2 className='page-title'>Müşteri Yönetimi</h2>
            <CustomerList />

            <h2 className='page-title'>Ürün Yönetimi</h2>
            <ProductList />
        </div>
    );
}

export default Admin;
