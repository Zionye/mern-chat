
import { useEffect, useState, useContext, useRef } from "react";
import Logo from "./Logo";
import Contact from "./Contact";
import { UserContext } from "../context/userContext";
import { uniqBy } from "lodash";
import axios from "axios";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]);

  const divUnderMessages = useRef();

  const {id, username, setId, setUsername} = useContext(UserContext);

  useEffect(() => {
    connectToWs();
  }, []);

  const connectToWs = () => {
    const ws = new WebSocket("ws://localhost:4040")
    console.log('chat ws: ', ws);
    setWs(ws);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('close', () => {
      setTimeout(()=>{
        console.log('Disconnected. Trying to reconnect.');
        connectToWs();
      }, 1000)
    });
  };

  const showOnlinePeople = (peopleArr) => {
    console.log('peopleArr: ', peopleArr);
    const people = {};
    peopleArr.forEach(({userId, username}) => {
      people[userId] = username;
    });
    console.log('people: ', people);
    setOnlinePeople(people);
  };

  const handleMessage = (ev) => {
    const messageData = JSON.parse(ev.data)
    console.log('messageData: ', ev, messageData);

    if('online' in messageData){
      showOnlinePeople(messageData.online);
    } else if('text' in messageData){
      console.log('handleMessage', messageData);
      setMessages(prev => ([...prev, {...messageData}]));
    }
  };

  const logout = () => {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  };

  const sendMessage = (ev) => {
    ev.preventDefault();
    ws.send(JSON.stringify({
      recipient: selectedUserId,
      text: newMessageText,
    }));
    setNewMessageText('');
    setMessages(prev => ([...prev, {
      text: newMessageText,
      sender: id,
      recipient: selectedUserId,
      _id: Date.now(),
    }]));
  };

  // 发送消息后，消息盒子滚动条滚动到最底部
  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
      div.scrollIntoView({behavior:'smooth', block:'end'});
    }
  }, [messages]);

  useEffect(() => {
    axios.get("/people").then(res => {
      // 从数据中先排除自己的用户，再排除在线用户
      const offlinePeopleArr = res.data
        .filter(p => p._id !== id)
        .filter(p => !Object.keys(onlinePeople).includes(p._id));
      console.log('offlinePeopleArr: ', offlinePeopleArr);
      const offlinePeople = {}
      offlinePeopleArr.map(p => {
        // offlinePeople[p._id] = p;
        offlinePeople[p._id] = p.username;
      })
      console.log('offlinePeople: ', offlinePeople);
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if(selectedUserId){
      axios.get(`/message/${selectedUserId}`).then(res => {
        setMessages(res.data)
      })
    }
  }, [selectedUserId]);

  // 除自己外的用户列表
  const onlinePeopleExclOurUser = {...onlinePeople};
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, '_id');

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo />

          {Object.keys(onlinePeopleExclOurUser).map(userId => (
            <Contact 
              online={true}
              key={userId}
              id={userId} 
              username={onlinePeopleExclOurUser[userId]}
              onSelect={(id) => {setSelectedUserId(userId);console.log({id, userId})}}
              selected={userId === selectedUserId}
            />
          ))}

          {Object.keys(offlinePeople).map(userId => (
            <Contact 
              online={false}
              key={userId}
              id={userId} 
              username={offlinePeople[userId]}
              onSelect={(id) => {setSelectedUserId(userId);console.log({id, userId})}}
              selected={userId === selectedUserId}
            />
          ))}
        </div>
        <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 text-sm text-gray-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
            {username}
          </span>
          <button
            onClick={logout} 
            className="text-sm bg-blue-100 py-1 px-2 text-gray-500 border rounded-sm"
          >
            logout
          </button>
        </div>
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-300">&larr; Select a person from the sidebar</div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDupes.map(message => (
                  <div key={message._id} className={(message.sender === id?'text-right':'text-left')}>
                    <div className={"inline-block text-left p-2 my-2 rounded-md text-sm " + (message.sender === id?"bg-blue-500 text-white" : "bg-white text-gray-500")}>
                      {/* sender: {message.sender} <br />
                      my id: {id} <br /> */}
                      { message.text }
                    </div>
                  </div>
                ))}

                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input 
              value={newMessageText}
              onChange={(ev)=>setNewMessageText(ev.target.value)}
              type="text" 
              placeholder="type your message here" 
              className="bg-white flex-grow border p-2 rounded-sm"
            />
            <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Chat