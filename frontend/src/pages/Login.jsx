import React, { useState } from 'react';
import axios from 'axios';
import '../css/Login.css';
import { useDispatch } from 'react-redux';
import { setLoginID } from '../redux/loginSlice';
import { useNavigate } from 'react-router-dom';

function Login() {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (name === 'admin' && password === 'admin') {
            alert('Admin Paneline Hoşgeldiniz...')
            dispatch(setLoginID(0));
            navigate('/admin')
        }
        else {
            
            try {
                const response = await axios.post('http://localhost:8081/customer', { name, password });
                if (response.data.message === 'login success') {
                    alert('Giriş başarılı. Hoşgeldiniz...');
                    dispatch(setLoginID(response.data.id));
                    navigate('/customer');  
                } else {
                    alert('Kullanıcı adı veya şifre yanlış.');
                    setName('');
                    setPassword('');
                }
            } catch (err) {
                console.log('API Error:', err);  
            }
        }
    };

    return (
        <div className='container-login' >
            <div className='header'>
                <form onSubmit={handleSubmit}>
                    <div className='text'>Giriş Paneli</div>
                    <div className="underline"></div>
                    <div className="inputs">
                        <div className="input">
                            <div className='icon'>
                                <i className="fa-solid fa-user fa-sm"></i>
                            </div>
                            <input type="text" placeholder='Kullanıcı Adı' value={name}
                                onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="input">
                            <div className="icon">
                                <i className="fa-solid fa-lock fa-sm"></i>
                            </div>
                            <input type="password" placeholder='Şifre' value={password}
                                onChange={e => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <div className="submit-container">
                        <button type=" submit" className="submit" >
                            Giriş Yap
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
