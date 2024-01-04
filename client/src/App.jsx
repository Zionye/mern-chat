// import Register from './pages/Register';
import axios from 'axios';
import { UserContextProvider } from './context/userContext';
import Routes from './router';

function App() {
  // 基础url （后台接口地址）
  axios.defaults.baseURL = 'http://localhost:4040';
  // 允许跨域
  axios.defaults.withCredentials = true;
  // Content-Type 响应头
  // axios.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
  // axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8";
  // // 超时时间是5秒
  // axios.defaults.timeout = 5000;

  return (
    <UserContextProvider>
      {/* <Register /> */}
      <Routes />
    </UserContextProvider>
  )
}

export default App
