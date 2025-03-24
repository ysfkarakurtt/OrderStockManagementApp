import { useEffect, useState } from 'react'
import './App.css'
import RouterConfig from './config/RouterConfig'
import Header from './components/Header'
import Drawer from '@mui/material/Drawer';
import { useSelector, useDispatch } from 'react-redux';
import { calculateBasket, setDrawer, clearBasket, clearAllBasket } from './redux/basketSlice';
import axios from 'axios';

function App() {

  const { products, drawer, totalAmount } = useSelector((store) => store.basket);
  const dispatch = useDispatch();
  const [orderStatus, setOrderStatus] = useState('');
  const [insufficientStock, setInsufficientStock] = useState([]);
  const { login_id } = useSelector((store) => store.login)
  let processResult = "";

  useEffect(() => {
    dispatch(calculateBasket());
    if (orderStatus !== '') {
      const timer = setTimeout(() => {
        setOrderStatus('');
      }, 6000);
      return () => clearTimeout(timer);
    }

  }, [orderStatus])

  const clearBasketById = (id) => {
    dispatch(clearBasket({ id }));
    dispatch(calculateBasket());
  }

  const processPayment = async (customer_id, products) => {

    let totalPrice = 0;
    products && products.map((product) => {
      totalPrice += product.count * product.price;
    })

    await axios.post('http://localhost:8081/process-payment', { customer_id, totalPrice })
      .then(async (res) => {
        processResult = res.data.process;
        if (!(res.data.process)) {
          const date = new Date().toISOString();
          await axios.post('http://localhost:8081/logs', { customer_id, date, type: "Error", details: "Customer budget insufficient", option: 3 })
            .then((res) => {
              setOrderStatus('balance-error');
            })
            .catch((err) => {
              console.log(err);
            })
        }
      })
      .catch((err) => {
        console.log(err)
      })
    return processResult;
  }

  const order = async (products) => {
    
    if (products.length > 0) {

      await axios.post('http://localhost:8081/stocks', products)
        .then(async (res) => {
          const customer_id = login_id.payload;

          if (res.data.process) {

            await processPayment(customer_id, products);

            if (processResult) {
              const date = new Date().toISOString();
              axios.post('http://localhost:8081/orders', { products, customer_id, date })
                .then((res) => {
                  
                  if (res.data.process) {

                    let order_ids = res.data.orderIds;
                    const date = new Date().toISOString();
                    axios.post('http://localhost:8081/logs', { customer_id, order_ids, date, type: "İnfo", details: "Purchasing successful", option: 1 })
                      .then((res) => {

                      })
                      .catch((err) => {

                      })
                    setOrderStatus('success');
                    dispatch(clearAllBasket());
                  }
                  else {
                    setOrderStatus('error');
                  }
                })
            }

          } else {
            const date = new Date().toISOString();
            axios.post('http://localhost:8081/logs', { customer_id, product_id: res.data.product.id, date, type: "Hata", details: "Ürün Stok Yetersiz", option: 2 })
              .then((res) => {

              })
              .catch((err) => {

              })
            setOrderStatus('failure');
            setInsufficientStock(res.data.product.name);
          }
        })
        .catch((err) => {
          console.log(err);
          const date = new Date().toISOString();
          axios.post('http://localhost:8081/logs', { customer_id, date, type: "Hata", details: "Veri Tabanı Hatası", option: 3 })
            .then((res) => {
              console.log(res.data)
            })
            .catch((err) => {

            })

          setOrderStatus('error');
        });
    }
    else {
      alert("Lütfen ürün seçin.")
    }

  }
  return (
    <>
      <Header />
      <RouterConfig />
      <Drawer anchor='right'
        open={drawer} onClose={() => dispatch(setDrawer())}>
        {
          products && products.map((product) => {
            return (
              <div className='drawer' key={product.id}>
                <p className='detail'> Ürün: {product.name}</p>
                <p className='detail'>Adet:({product.count})</p>
                <p className='detail'>Fiyatı:{product.price} TL</p>
                <button className='delete-button btn btn-danger' onClick={() => clearBasketById(product.id)}>Sil</button>

              </div>
            )
          })
        }
        <div>
          <p className='detail' style={{ textAlign: 'center' }}>Toplam Tutar:{totalAmount}</p>
          <div className='order-button'>
            <button className='btn btn-success' onClick={() => order(products)}>Sipariş Ver</button>
          </div>

          {
            orderStatus === 'success' && (
              <div className="alert alert-success" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              > Sipariş Başarıyla Oluşturuldu.Siparişlerim sayfasından görünteleyebilirsiniz. </div>)
          }

          {
            orderStatus === 'failure' && (
              <div className="alert alert-danger" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              > Sipariş oluşturulamadı. Yetersiz stok: {insufficientStock} </div>)
          }

          {
            orderStatus === 'error' && (<div className="alert alert-danger" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            > Sipariş Oluşturulurken bir hata oluştu, lütfen daha sonra tekrar deneyiniz. </div>)
          }

          {
            orderStatus === 'balance-error' && (<div className="alert alert-danger" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            > Müşteri bakiyesi yetersiz, lütfen daha sonra tekrar deneyiniz. </div>)
          }
          
        </div>
      </Drawer>
    </>
  )
}

export default App
