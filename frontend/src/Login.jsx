import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from './api';
import "./Styles.css"

const Login = () => {
    const [info, setInfo] = useState({email: "", password: ""});
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/getinfo")
            .then((response) => {
                if (response.data.user) {
                    navigate("/home");
                }
            })
            .catch(error => console.error("Error fetching info:", error));
    }, [navigate]);

    const handleChange = (event) => {
        const type = event.target.name;
        const value = event.target.value;
        setInfo(previnfo => ({...previnfo, [type]: value}))
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        axios.post("/login", info)
        .then((response) => {
            if (response.data.valid){
                navigate("/home");
            } else {
                setError("combo doesn't exist");
            }
        })
        .catch(error => console.error("Error fetching info:", error));
    }

    return(
        <div className='login'>
            <div className='loginmessage'>
                <h1>MEME MEDIA</h1>
            </div>
            <div className='loginform'>
                <form onSubmit={handleSubmit}>
                    <input type='email' placeholder='email' name = 'email' value = {info.email} onChange={handleChange}/><br></br>
                    <input type='password' placeholder='password' name ='password' value = {info.password} onChange={handleChange}/><br></br>
                    <input type='submit' value='LOGIN'/><br></br>
                    <Link to="/signup">Create new account</Link><br></br>
                    <label>{error}</label>
                </form>
            </div>
        </div>
    )
}
export default Login;
