import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { CiCirclePlus, CiCircleMinus } from "react-icons/ci";
import '../css/ProductList.css'
import { FaBasketShopping } from "react-icons/fa6";
import { addToBasket, calculateBasket } from '../redux/basketSlice';
import { useNavigate } from 'react-router-dom';

function ProductList() {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const dispatch = useDispatch();
    const [productCounts, setProductCounts] = useState([]);
    const [productStockCounts, setProductStockCounts] = useState([]);
    const { login_id } = useSelector((store) => store.login)
    const [productName, setProductName] = useState('');
    const [productStock, setProductStock] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:8081/products')
            .then(res => {
                setProducts(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError("Veriler alınırken bir hata oluştu.");
                setLoading(false);
            })
    }, []);

    const increment = (productId) => {
        setProductCounts((prevCounts) => ({
            ...prevCounts,
            [productId]: (prevCounts[productId] || 0) + 1,
        }));
    }

    const decrement = (productId) => {
        setProductCounts((prevCounts) => ({
            ...prevCounts,
            [productId]: Math.max((prevCounts[productId] || 0) - 1, 0),
        }));
    }

    const addBasket = (productId) => {
        const count = productCounts[productId];

        if (count > 0 && count <= 5) {
            const product = products.find((p) => p.id === productId);

            if (product) {
                const payload = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    stock: product.stock,
                    count: count,
                };

                dispatch(addToBasket(payload));
                dispatch(calculateBasket());
            }
        } else if (count > 5) {
            alert("Bir üründen en fazla 5 adet satın alınabilir. Lütfen tekrar deneyiniz.")
        }
        else {
            alert("Ürün adeti 0 veya daha küçük olamaz.");
        }
    };

    const removeProduct = (id) => {
        axios.post('http://localhost:8081/remove-product', { id })
            .then((res) => {

                if (res.data.process) {
                    const date = new Date().toISOString();
                    axios.post('http://localhost:8081/logs', { customer_id: login_id.payload, date, type: "Bilgilendirme", details: "Admin ürün sildi", option: 3 })
                }
            })
            .catch((err) => {
                console.error(err);
            })
        navigate(0);
    }

    const addProduct = () => {
        if (!productName || !productStock || !productPrice) {
            alert("Lütfen eklemek istediğiniz ürünün tüm bilgilerini giriniz.")
        }
        axios.post('http://localhost:8081/add-product', { name: productName, stock: productStock, price: productPrice })
            .then((res) => {
                if (res.data.process) {
                    const date = new Date().toISOString();
                    axios.post('http://localhost:8081/logs', { customer_id: login_id.payload, date, type: "Bilgilendirme", details: "Admin yeni ürün ekledi", option: 3 })
                }
                navigate(0);
            })
            .catch((err) => {
                console.error(err)
            })

    }
    const updateStock = async (id) => {

        await axios.post('http://localhost:8081/update-product', { stock: productStockCounts[id], id })
            .then((res) => {
                if (res.data.process) {
                    const date = new Date().toISOString();
                    axios.post('http://localhost:8081/logs', { customer_id: login_id.payload, date, type: "Bilgilendirme", details: "Admin ürünün stoğunu güncelledi", option: 2, product_id: id })
                }
                navigate(0);
            })
            .catch((err) => {
                console.error(err)
            })
    }

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Ürün Listesi</h2>

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
                            <th>Stok</th>
                            <th>Fiyat</th>
                            
                            {
                                login_id.payload > 0 && (
                                <>
                                    <th></th>
                                    <th></th>
                                </>

                            )
                            }

                            {
                                login_id.payload == 0 && (
                                <>
                                    <th></th>
                                    <th></th>

                                </>

                            )
                            }

                        </tr>
                    </thead>
                    <tbody>
                        
                        {
                            products.map((product) => (
                            
                                <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>{product.name}</td>
                                <td>{product.stock}</td>
                                <td>{product.price}</td>

                                {
                                    login_id.payload > 0 && (
                                    <td>
                                        <CiCirclePlus className='icon' onClick={() => increment(product.id)} />
                                        <span className='count'>{productCounts[product.id] || 0} </span>
                                        <CiCircleMinus className='icon' onClick={() => decrement(product.id)} />

                                    </td>

                                )
                                }

                                {
                                    login_id.payload > 0 && (
                                    <td>

                                        <div className='btn-container'>
                                            <button type="submit"
                                                onClick={() => addBasket(product.id)}
                                                className="btn btn-success  btn-add-to-cart">
                                                <FaBasketShopping className="icon" />
                                                Sepete Ekle
                                            </button>
                                        </div>
                                    </td>

                                )
                                }

                                {   
                                    login_id.payload == 0 && (
                                    <td>

                                        <div className='btn-container'>
                                            <button type="submit"
                                                onClick={() => removeProduct(product.id)}
                                                className="btn btn-danger">
                                                Sil
                                            </button>
                                        </div>
                                    </td>

                                )
                                }

                                {
                                    login_id.payload == 0 && (
                                    <td>

                                        <div className='btn-container'>
                                            <input type="text" placeholder='Yeni Stok Miktarını Giriniz' value={productStockCounts[product.id]}
                                                onChange={e => setProductStockCounts((prevCounts) => ({
                                                    ...prevCounts,
                                                    [product.id]: (e.target.value),
                                                }))} />
                                            <button type="submit"
                                                onClick={() => updateStock(product.id)}
                                                className="btn btn-success ml-5">
                                                Stok Güncelle
                                            </button>
                                        </div>
                                    </td>

                                )
                                }

                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className='add-product'>
                <h2 className='page-title'>Ürün Ekleme</h2>
                {login_id.payload == 0 ? (
                    <div>
                        <table className='table table-striped'>
                            <thead className='thead-dark'>
                                <tr>
                                    <th>Ürün Adı</th>
                                    <th>Ürün Stok</th>
                                    <th>Ürün Fiyatı</th>
                                    <th></th>
                                </tr>

                            </thead>
                            <tbody>
                                <td>
                                    <input type="text" placeholder='Ürün Adı' value={productName}
                                        onChange={e => setProductName(e.target.value)} />

                                </td>
                                <td>
                                    <input type="text" placeholder='Ürün Stok' value={productStock}
                                        onChange={e => setProductStock(e.target.value)} />
                                </td>
                                <td>
                                    <input type="text" placeholder='Ürün Fiyat' value={productPrice}
                                        onChange={e => setProductPrice(e.target.value)} />
                                </td>

                                <div className='btn-container'>
                                    <button type="submit"
                                        onClick={() => addProduct()}
                                        className="btn btn-success mr-5">
                                        Ekle
                                    </button>
                                </div>
                            </tbody>
                        </table>
                    </div>
                ) : ""
                }
            </div>

        </div >
    )
}

export default ProductList;
