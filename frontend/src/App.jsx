import Login from "./Login";
import Signup from "./Signup";
import Success from "./Success";
import Home from "./Home";
import Create from "./Create";
import Search from "./Search";
import Comments from "./Comments";
import Profile from "./Profile";
import Notifications from "./Notifications";
import UserProfile from "./UserProfile";

import { BrowserRouter, Routes, Route } from "react-router-dom";
const App = () => {
    return(
        <BrowserRouter>
            <Routes>
                <Route path = "/" element = {<Login/>}></Route>
                <Route path = "/signup" element = {<Signup/>}></Route>
                <Route path = "/success" element = {<Success/>}></Route>
                <Route path = "/home" element = {<Home/>}></Route>
                <Route path = "/create" element = {<Create/>}></Route>
                <Route path = "/profile" element = {<Profile/>}></Route>
                <Route path = "/search" element = {<Search/>}></Route>
                <Route path = "/comments" element = {<Comments/>}></Route>
                <Route path = "/notifications" element = {<Notifications/>}></Route>
                <Route path = "/:username" element = {<UserProfile/>}></Route>
            </Routes>
        </BrowserRouter>
    )
}
export default App;