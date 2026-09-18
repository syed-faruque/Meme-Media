import Navbar from "./Navbar";
import {useState} from "react";
import axios from "./api";
import { useNavigate } from "react-router-dom";

const Create = () => {
    const [file, setFile] = useState()
    const [caption, setCaption] = useState()
    const navigate = useNavigate()

    const upload = () => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('caption', caption)
        axios.post("/upload", formData)
        .then((response) => {
            if (response.data)
                navigate("/home")
        })
        .catch(error => console.error("Error fetching info:", error));
    }

    return(
        <div className="create">
            <Navbar /><br></br><br></br>
            <div className="create-contents">
            {file && 
                <div className="create-image">
                    <img src={URL.createObjectURL(file)} alt="Selected Image" /><br></br>
                </div>}
                <div className="create-caption">
                    <textarea placeholder="Write something here..." value={caption} onChange={(event) => setCaption(event.target.value)}/><br></br>
                    {!file && <div><input type="file" accept="image/*" onChange={(event)=>{setFile(event.target.files[0])}}/><br></br></div>}
                    {file && <div><button type="button" onClick={upload}>UPLOAD MEME</button><br></br></div>}
                </div>
            </div>
        </div>
    )
}

export default Create;
