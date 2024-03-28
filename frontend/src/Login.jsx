//necessary imports
import {useState} from 'react';
import {Link} from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./Styles.css"

//makes credentials visible for all requests sent out by axios
axios.defaults.withCredentials = true;

//login component
const Login = () => {
    const [info, setInfo] = useState({email: "", password: ""});
    const [error, setError] = useState('');
    const navigate = useNavigate();

    //function for updating the state of the email and password when the user types them in
    const handleChange = (event) => {
        const type = event.target.name;
        const value = event.target.value;
        setInfo(previnfo => ({...previnfo, [type]: value}))
    }

    //function for sending out the credentials the user typed in the input fields to the server and then capturing its response.
    const handleSubmit = (event) => {
        event.preventDefault();
        axios.post("http://192.168.0.202:1111/login", info)
        .then((response) => {
            if (response.data.valid){
                navigate("/home");
            } else {
                setError("combo doesn't exist");
            }
        })
        .catch(error => console.error("Error fetching info:", error));
    }

    //shows the title followed by a login form
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


