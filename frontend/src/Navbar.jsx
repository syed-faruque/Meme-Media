import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import "./Styles.css";

axios.defaults.withCredentials = true;

const Navbar = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".navsearchresults")){
                setSearchResults([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        
    }, []);

    const handleChange = (event) => {
        const value = event.target.value;
        setSearch(value);
        axios.post("http://192.168.0.202:1111/searchusers", { search: value })
            .then((response) => {
                setSearchResults(response.data);
            })
    }

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            axios.post("http://192.168.0.202:1111/searchusers", { search: search })
            .then((response) => {
                if (response.data) {
                    if (window.location.pathname === '/search') {
                        window.location.reload();
                    } 
                    else {
                        navigate("/search");
                    }
                }
            })
        }
    };

    const handleResultsClick = (index) => {
        navigate(`/${searchResults[index]}`)
        setSearchResults([]);
    }


    const handleBarClick = (event) => {
        handleChange(event);
    }

    return (
        <div className="navbar">
            <label>Meme Media</label>
            <div className='searchfeatures'>
                <input placeholder="Search" value={search} onClick={handleBarClick} onChange={handleChange} onKeyPress={handleKeyPress} type="text"/>
                <div className="navsearchresults">
                    {searchResults.map((user, index) => (
                        <div className="results" key={index} onClick={() => handleResultsClick(index)}>{user}</div>
                    ))}
                </div>
            </div>
            <Link to="/create"><button name="create">Create</button></Link>
            <Link to="/home"><button name="home">Home</button></Link>
            <Link to="/profile"><button name="profile">Profile</button></Link>
            <Link to="/notifications"><button name="notifications">Notifications</button></Link>
            <Link to="/"><button name="logout">Logout</button></Link>
        </div>
    )
}

export default Navbar;
