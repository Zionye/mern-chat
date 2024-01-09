
import { useEffect, useState, useContext, useRef } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "../context/userContext";
import { uniqBy } from "lodash";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]);

  const divUnderMessages = useRef();

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
    const messageData = JSON.parse(ev.data)
    console.log('messageData: ', ev, messageData);

    if('online' in messageData){
      showOnlinePeople(messageData.online);
    } else if('text' in messageData){
      console.log('handleMessage', messageData);
      setMessages(prev => ([...prev, {...messageData}]));
    }
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

  // 除自己外的用户列表
  const onlinePeopleExclOurUser = {...onlinePeople};
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, '_id');

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
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDupes.map(message => (
                  <div key={message._id} className={(message.sender === id?'text-right':'text-left')}>
                    <div className={"inline-block text-left p-2 my-2 rounded-md text-sm " + (message.sender === id?"bg-blue-500 text-white" : "bg-white text-gray-500")}>
                      sender: {message.sender} <br />
                      my id: {id} <br />
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