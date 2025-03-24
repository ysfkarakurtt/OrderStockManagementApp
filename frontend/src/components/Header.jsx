import React, { useEffect, useState } from 'react';
import '../css/Header.css';
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import { FaHome } from "react-icons/fa";
import { RiLoginBoxFill } from "react-icons/ri";
import { useSelector, useDispatch } from 'react-redux';
import { setLoginID } from '../redux/loginSlice';
import { AiOutlineUnorderedList } from "react-icons/ai";
import Badge from '@mui/material/Badge';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { setDrawer } from '../redux/basketSlice';
import axios from 'axios';

function Header() {

    const [customer, setCustomer] = useState('');
    const dispatch = useDispatch();
    const { login_id } = useSelector((store) => store.login);
    const { products } = useSelector((store) => store.basket);
    const location = useLocation();
    const StyledBadge = styled(Badge)(({ theme }) => ({
        '& .MuiBadge-badge': {
            right: -3,
            top: 13,
            border: `2px solid ${theme.palette.background.paper}`,
            padding: '0 4px',
        },
    }));

    useEffect(() => {
        if (login_id.payload > 0) {
            fetchCustomerById(login_id.payload);
        }
    }, [location, login_id.payload])

    const logout = () => {
        dispatch(setLoginID(-1));
        alert("Başarıyla Çıkış Yaptınız...");
    }
    const fetchCustomerById = async (id) => {
        await axios.post('http://localhost:8081/fetch-customer', { id })
            .then(res => {
                setCustomer(res.data[0]);
            })
            .catch(err => {
                console.log("Veriler alınırken bir hata oluştu.");
            })
    }

    return (
        <div>
            <nav className="navbar navbar-expand-lg  fixed-top" >
                <a className="navbar-brand" href="/">
                    <img src="" alt="" />
                    <h3 id="header-title">Sipariş Stok Yönetimi</h3>
                </a>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="header collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav ml-auto ">
                        <li className="nav-item active">
                            <div className="icon-navbar"> <FaHome className='icon' id='icon-home' />
                                <a className="nav-link" href="/">Anasayfa</a>
                            </div>
                        </li>

                        {
                             login_id.payload > 0 ? (
                                <>
                                    <li className="nav-item">
                                        <div className="icon-navbar"><AiOutlineUnorderedList className='icon' id='icon-chat' />
                                            <Link className="nav-link" to="/my-orders">Siparişlerim</Link>
                                        </div>
                                    </li>
                                    <li className="nav-item">
                                        <IconButton onClick={() => dispatch(setDrawer())} aria-label="cart">
                                            <StyledBadge badgeContent={products.length} color="error" >
                                                <ShoppingCartIcon
                                                    style={{ marginRight: '3px' }} />
                                            </StyledBadge>

                                        </IconButton>
                                        <div onClick={() => dispatch(setDrawer())} className='my-basket'>Sepetim</div>
                                    </li><li className="nav-item">
                                        <div className='icon-navbar'><CgProfile className='icon' />
                                            <Link className="nav-link" >Bakiyem:{customer.budget}</Link>
                                        </div>
                                    </li>
                                    <button className='button-logout'>
                                        <div className="icon-navbar" id='logout-navbar'>
                                            <RiLoginBoxFill className='icon' id='icon-logut' />
                                            <Link className="nav-link" to="/" onClick={logout}>Çıkış Yap</Link>
                                        </div>
                                    </button>
                                </>) :
                                <div></div>
                        }

                        {
                            login_id.payload == 0 ? (<>
                                <li className="nav-item">
                                    <div className="icon-navbar"><AiOutlineUnorderedList className='icon' id='icon-chat' />
                                        <Link className="nav-link" to="/orders">Gelen Siparişler</Link>
                                    </div>
                                </li>
                                <li className="nav-item">
                                    <div className="icon-navbar"><AiOutlineUnorderedList className='icon' id='icon-chat' />
                                        <Link className="nav-link" to="/logs">Loglar</Link>
                                    </div>
                                </li>
                                <li className="nav-item">
                                    <div className="icon-navbar"><AiOutlineUnorderedList className='icon' id='icon-chat' />
                                        <Link className="nav-link" to="/admin">Admin </Link>
                                    </div>
                                </li>
                                <button className='button-logout'>
                                    <div className="icon-navbar" id='logout-navbar'>
                                        <RiLoginBoxFill className='icon' id='icon-logut' />
                                        <Link className="nav-link" to="/" onClick={logout}>Çıkış Yap</Link>
                                    </div>
                                </button>
                            </>
                            ) :
                                <div></div>
                        }

                        {
                             login_id.payload < 0 ? (<>
                                <li className="nav-item" id='li-login'>
                                    <button className='button-login'>
                                        <div className="icon-navbar" id='login-navbar'>
                                            <RiLoginBoxFill className='icon' id='icon-login' />
                                            <Link className="nav-link" to="/login"> Giriş Yap</Link>
                                        </div>
                                    </button>
                                </li>
                            </>) : <div>
                            </div>
                        }

                    </ul>
                </div>
            </nav>
        </div >
    );
}

export default Header;
