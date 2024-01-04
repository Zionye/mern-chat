
import { useEffect, useState, useContext } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "../context/userContext";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);

  const {id} = useContext(UserContext);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4040")
    console.log('chat ws: ', ws);
    setWs(ws);
    ws.addEventListener('message', handleMessage);
  }, []);

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
    console.log('new message', ev)
    const messageData = JSON.parse(ev.data)
    console.log('messageData: ', messageData);

    if('online' in messageData){
      showOnlinePeople(messageData.online);
    }
  };

  // 除自己外的用户列表
  const onlinePeopleExclOurUser = {...onlinePeople};
  delete onlinePeopleExclOurUser[id];

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <Logo />

        {Object.keys(onlinePeopleExclOurUser).map(userId => (
          <div 
            onClick={()=>setSelectedUserId(userId)} 
            key={userId} 
            className={`border-b border-gray-100 flex items-center gap-2 ${userId === selectedUserId ? 'bg-blue-50' : ''}`}>
              {userId === selectedUserId && (
                <div className="w-1 h-12 bg-blue-500 rounded-r-md" />
              )}
              <div className="flex gap-2 py-2 pl-4 items-center">
                <Avatar username={onlinePeople[userId]} userId={userId}/>
                <span>{onlinePeople[userId]}</span>
              </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-300">&larr; Select a person from the sidebar</div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="type your message here" className="bg-white flex-grow border p-2 rounded-sm"/>
          <button className="bg-blue-500 p-2 text-white rounded-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat