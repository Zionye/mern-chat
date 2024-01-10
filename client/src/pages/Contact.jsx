
import Avatar from "./Avatar";

const Contact = ({id, username, onSelect, selected, online}) => {
  return (
    <div 
    // key={id} 
      onClick={()=>onSelect(id)} 
      className={`border-b border-gray-100 flex items-center gap-2 ${selected ? 'bg-blue-50' : ''}`}>
        {selected && (
          <div className="w-1 h-12 bg-blue-500 rounded-r-md" />
        )}
        <div className="flex gap-2 py-2 pl-4 items-center">
          <Avatar online={online} username={username} userId={id}/>
          <span>{username}</span>
        </div>
    </div>
  )
}

export default Contact