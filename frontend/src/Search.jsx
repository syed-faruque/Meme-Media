//necessary imports
import Navbar from "./Navbar";
import axios from "axios";
import {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";

//makes credentials visible for all requests sent out by axios
axios.defaults.withCredentials=true;

//search component
const Search = () => {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    //function for fetching searchresults from the server
    const fetchResults = () => {
        axios.get("http://192.168.0.202:1111/getsearchresults")
        .then((response)=>{
            setUsers(response.data);
        })
    }

    //function that navigates to the profile of the person the user clicks on
    const handleClick = (index) => {
        navigate(`/${users[index]}`);
    }

    //initiates fetch function as soon as the component mounts.
    useEffect(()=>{
        fetchResults();
    }, [])

    //maps out the search results.
    return(
        <div className="searchresults-container">
            <Navbar />
            <div className="search">
                <h2 className="searchresults-heading">People</h2>
                <div className="searchresults">
                    {users.map((user, index)=>(
                         <div className="user" key={index} onClick={() => handleClick(index)}>
                            {user}
                        </div>
                    ))}
                </div>
            </div>
        </div>

    )

}

export default Search;
