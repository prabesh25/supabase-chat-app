import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersOnline, setUsersOnline] = useState([]);
  const chatContainerRef = useRef(null)
  const scroll = useRef()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  //signin
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  //signout

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  useEffect(() => {
setTimeout(() => {
  if(chatContainerRef.current) {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }
})
  }, [messages])

  useEffect(() => {
    if (!session?.user) {
      setUsersOnline([]);
      return;
    }
    const roomOne = supabase.channel("room_one", {
      config: {
        presence: {
          key: session?.user?.id,
        },
      },
    });
    roomOne.on("broadcast", { event: "message" }, (payload) => {
      setMessages((prevMessages) => [...prevMessages, payload.payload]);
    });

    //track user presence subscribe
    roomOne.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await roomOne.track({
          id: session?.user?.id,
        });
      }
    });

    //handle user presence
    roomOne.on("presence", { event: "sync" }, () => {
      const state = roomOne.presenceState();
      setUsersOnline(Object.keys(state));
    });

    return () => {
      roomOne.unsubscribe();
    };
  }, [session]);

  //send message
  const sendMessage = async (e) => {
    e.preventDefault();

    supabase.channel("room_one").send({
      type: "broadcast",
      event: "message",
      payload: {
        message: newMessage,
        user_name: session?.user?.user_metadata?.email,
        avatar: session?.user?.user_metadata?.avatar_url,
        timestamp: new Date().toISOString(),
      },
    });
    setNewMessage("");
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString("en-us", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (!session) {
    return (
      <div className="w-full flex h-screen justify-center  items-center">
        <button className="border p-2 bg-green-200" onClick={signIn}>
          sign in with google to chat
        </button>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-3xl border border-gray-700 rounded-lg p-4 space-y-4">
          {/* header */}
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <div>
              <p className="text-sm">
                signed in as{" "}
                <span className="italic">name {session?.user?.email}</span>
              </p>
              <p className="text-xs text-gray-400">{usersOnline.length} users online</p>
            </div>
            <button
              onClick={signOut}
              className="bg-gray-700 px-4 py-1 rounded hover:bg-gray-600 text-sm"
            >
              Sign out
            </button>
          </div>
{/* main chat */}
<div ref={chatContainerRef} className="p-4 flex flex-col overflow-y-auto h-[500px]">
  {messages.map((msg, idx) => (
    <div
      key={idx}
      className={`my-2 flex w-full items-start ${
        msg?.user_name === session?.user?.email ? "justify-end" : "justify-start"
      }`}
    >
      {/* received message on left */}
      {msg?.user_name !== session?.user?.email && (
        <img
          src={msg.avatar}
          alt="/"
          className="w-10 h-10 rounded-full mr-2"
        />
      )}

      <div className="flex flex-col w-full">
        <div
          className={`p-1 max-w-[70%] rounded-xl ${
            msg?.user_name === session?.user?.email
              ? "bg-gray-700 text-white ml-auto"
              : "bg-gray-500 text-white mr-auto"
          }`}
        >
          <p>{msg.message}</p>
        </div>

        <div
          className={`text-xs opacity-75 pt-1 ${
            msg?.user_name === session?.user?.email
              ? "text-right mr-2"
              : "text-left ml-2"
          }`}
        >
          {formatTime(msg?.timestamp)}
        </div>
      </div>

      {msg?.user_name === session?.user?.email && (
        <img
          src={msg.avatar}
          alt="/"
          className="w-10 h-10 rounded-full ml-2"
        />
      )}
    </div>
  ))}
</div>

{/* message input */}
<form
  onSubmit={sendMessage}
  className="flex items-center space-x-2 border-t border-gray-700 pt-2"
>
  <input
    value={newMessage}
    type="text"
    onChange={(e) => setNewMessage(e.target.value)}
    placeholder="Type a message..."
    className="flex-grow bg-gray-800 text-white p-2 rounded"
  />
  <button
    type="submit"
    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm"
  >
    Send
  </button>
  <span ref={scroll}></span>
</form>
        </div>
      </div>
    );
  }
}

export default App;
