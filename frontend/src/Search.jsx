import Navbar from "./Navbar";
import axios from "./api";
import {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";

const Search = () => {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    const fetchResults = () => {
        axios.get("/getsearchresults")
        .then((response)=>{
            setUsers(response.data);
        })
    }

    const handleClick = (index) => {
        navigate(`/${users[index]}`);
    }

    useEffect(()=>{
        fetchResults();
    }, [])

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
