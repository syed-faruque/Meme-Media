//this navigation bar will be imported into other components so that it can be displayed at the top of those pages

//necessary imports
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import "./Styles.css";

//makes credentials visible for all requests sent out by axios
axios.defaults.withCredentials = true;

//navbar component
const Navbar = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    //has an event listener listen for clicks outside of the navigation bar. It deals with this click by closing out the bar.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".navsearchresults")){
                setSearchResults([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        
    }, []);

    //function for updating the search state when the user types in his search
    const handleChange = (event) => {
        const value = event.target.value;
        setSearch(value);
        axios.post("http://192.168.0.202:1111/searchusers", { search: value })
            .then((response) => {
                setSearchResults(response.data);
            })
    }

    //function for sending the user's search to the serverside and then transitioning to the search results.
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

    //function for navigating to the profile of the person who the user picks out of the search results.
    const handleResultsClick = (index) => {
        navigate(`/${searchResults[index]}`)
        setSearchResults([]);
    }

    //function for showcasing searchresults as soon as the user presses on the search bar.
    const handleBarClick = (event) => {
        handleChange(event);
    }

    //jsx for the navbar. Contains all the buttons on the bar. Also handles how search results are mapped out.
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
