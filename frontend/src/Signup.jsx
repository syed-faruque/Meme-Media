import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.withCredentials = true;

const Signup = () => {
    const [info, setInfo] = useState({ email: "", username: "", password: "", confirm: "" })
    const [error, setError] = useState('')
    const navigate = useNavigate();

    const handleChange = (event) => {
        const type = event.target.name;
        const value = event.target.value;
        setInfo(prevInfo => ({ ...prevInfo, [type]: value }));
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        const { email, username, password, confirm } = info;
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        const usernameOk = /^[a-zA-Z0-9_]{3,30}$/.test(username.trim());
        if (emailOk && usernameOk && password.length >= 8 && password === confirm) {
            axios.post("http://localhost:1111/signup", {
                email: email.trim(),
                username: username.trim(),
                password,
            })
                .then((response) => {
                    if (response.data.valid) {
                        navigate("/success");
                    } else {
                        setError("This email has already been registered, or the username was taken");
                    }
                })
                .catch(error => console.error("Error fetching info:", error));
        } else {
            setError("Use a valid email, a 3-30 character username (letters/numbers/_), and a password of at least 8 characters that matches confirm")
        }
    }

    return (
        <div className='signup'>
            <div className='signupmessage'>
                <h1>MEME MEDIA</h1>
            </div>
            <div className='signupform'>
                <form onSubmit={handleSubmit}>
                    <input type="email" name="email" placeholder='enter email' onChange={handleChange} /><br></br>
                    <input type="text" name="username" placeholder='create username' onChange={handleChange} /><br></br>
                    <input type="password" name="password" placeholder='create password' onChange={handleChange} /><br></br>
                    <input type="password" name="confirm" placeholder='confirm password' onChange={handleChange} /><br></br>
                    <input type="submit" value="CREATE ACCOUNT" /><br></br>
                    <Link to="/">Already have an account</Link><br></br>
                    <label>{error}</label>
                </form>
            </div>
        </div>
    )

}

export default Signup;
