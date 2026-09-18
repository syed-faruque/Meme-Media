//~~~~~~~~all my pages~~~~~~~~~//

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
import RequireAuth from "./RequireAuth";

//~~~~~~~~establishes routing~~~~~~~~~//

import { BrowserRouter, Routes, Route } from "react-router-dom";
const App = () => {
    return(
        <BrowserRouter>
            <Routes>
                <Route path = "/" element = {<Login/>}></Route>
                <Route path = "/signup" element = {<Signup/>}></Route>
                <Route path = "/success" element = {<Success/>}></Route>
                <Route path = "/home" element = {<RequireAuth><Home/></RequireAuth>}></Route>
                <Route path = "/create" element = {<RequireAuth><Create/></RequireAuth>}></Route>
                <Route path = "/profile" element = {<RequireAuth><Profile/></RequireAuth>}></Route>
                <Route path = "/search" element = {<RequireAuth><Search/></RequireAuth>}></Route>
                <Route path = "/comments" element = {<RequireAuth><Comments/></RequireAuth>}></Route>
                <Route path = "/notifications" element = {<RequireAuth><Notifications/></RequireAuth>}></Route>
                <Route path = "/:username" element = {<RequireAuth><UserProfile/></RequireAuth>}></Route>
            </Routes>
        </BrowserRouter>
    )
}
export default App;
