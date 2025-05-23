// REAL TIME BORADCAST use garne no store of chats in db.
// real time subabase channel ra broadcast ko use for sending messages.


import { useState, useEffect, useRef } from "react";
// client side ma run huna ko lagi import client: server site ma run na garne
import { supabase } from "./supabaseClient";
// import forestBg from './images/forestbg.jpg';

function App() {
    // Use state haru ko declaration, value haru update ra change garna ko lagi

  const [session, setSession] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersOnline, setUsersOnline] = useState([]);
  const [showReadme, setShowReadme] = useState(false);
  const chatContainerRef = useRef(null);
  const scroll = useRef();

      // use-effect hook for running while the page loads
  useEffect(() => {
      //.getsession check garne ko lagi user loggedin cha ki chaina vanera
      //.then - data: session ko kam vanya parkhina supabase le session ko info send garun jel
      //ani setsesstion(session) xai agi declare garako "usestate: setSession" ma ako response lai set garnu.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

      // auth changes lai listen garna ko lagi: user login ra logout hudha 
      //       supabase.auth.onAuthStateChange ko kam vanya
      //  login/logout events hudha listen garnu ho, user login ra logout hudha khari yo function run huncha hai.

    const {
        
      data: { subscription },

// event, session => setsession:session 
// auth changes hudha yo function run huncha
// new session lincha ani save garcha using setSession.
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

      //simple cleanup function ho: user le page change gardha,  listening garne stop garcha.
    return () => subscription.unsubscribe();
  }, []);

    
 // yo chai each time run huncha jaba message ma change huncha
  useEffect(() => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    });
  }, [messages]);

    // user ko presence check garna
  useEffect(() => {
    if (!session?.user) {
      setUsersOnline([]);
      return;
    }

//Supabase ko channel create garcha : roomone name
// ani user ko id le garara user lai track garcha   
    const roomOne = supabase.channel("room_one", {
      config: { presence: { key: session?.user?.id } },
    });

      //message haru ko lagi listen garcha ani, Listen for real-time "message" broadcasts.
        // message sent hudha khari : messages list ma add garcha
    roomOne.on("broadcast", { event: "message" }, (payload) => {
      setMessages((prev) => [...prev, payload.payload]);
    });

      // room join vaye pachi uuser online lai trach krakhna ko lagi
    roomOne.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await roomOne.track({ id: session?.user?.id });
      }
    });

      // chages herna ko lagi ko online cha vanera, 
      // yesla chai userOnline state lai update garcha sabai user ko ids le.
    roomOne.on("presence", { event: "sync" }, () => {
      const state = roomOne.presenceState();
      setUsersOnline(Object.keys(state));
    });

      // component unmount hudha room leave 
    return () => roomOne.unsubscribe();
  }, [session]);

    // sign in ko lagi
    // google bata signin huncha ani redirect huncha app ko link ma hai.
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google",
      options: {
        redirectTo: 'https://supabase-chat-ap.vercel.app/', 
      },
     });
  };

    // signout ko lagi
  const signOut = async () => {
    await supabase.auth.signOut();
  };

    // messages haru send garna ko lagi
    // send message le sabai jana lai message send garcha group ma vako jati lai
  const sendMessage = async (e) => {
    e.preventDefault();
      // s.c ('r.o') ko kam chat-room ma redirect garne ho
      //.send ra broadcast : ko kam vanya sabai lai message send garne ho jo jo room ma cha
    supabase.channel("room_one").send({
      type: "broadcast",
        // broadcast lai name dina ko lagi ho
      event: "message",
        // data send gariako vanya payload vai halyo
      payload: {
        message: newMessage,
        user_name: session?.user?.email,
        avatar: session?.user?.user_metadata?.avatar_url,
        timestamp: new Date().toISOString(),
      },
    });
    setNewMessage(""); //input box clear garne ho message snet gari saka paxi.
  };

    // message send garda exact time dhakauna kati khera message sent vako vanera
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString("en-us", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

    // session available na hudha signin page ma redirect garna
  if (!session) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <button
          onClick={signIn}
          className="px-8 cursor-pointer py-3 bg-gradient-to-br from-blue-800 to-cyan-700 rounded-full text-gray-50 font-semibold
          tracking-wide hover:from-blue-600 hover:to-blue-700 transform transition-all duration-300 hover:scale-105
          shadow-2xl hover:shadow-3xl hover:shadow-cyan-500/20 border-2 border-transparent hover:border-white/10
          backdrop-blur-sm hover:backdrop-blur-md"
        >
          Sign in with Google to Chat
        </button>
      </div>
    );
  }

  return (
    <div
    className="bg-cover min-h-screen relative flex items-center justify-center p-4"
    style={{ backgroundImage: 'url("/images/forestbg.jpg")' }}>
  
      <button
        onClick={() => setShowReadme(true)}
        className="px-3 py-1 top-4 absolute bg-gray-600/50 hover:bg-gray-500/60 text-gray-200 rounded-lg
      transition-all duration-200 text-sm hover:scale-[1.02]"
      >
        How to Use
      </button>
      <div className="w-full h-[600px] max-w-3xl border-none bg-blue/5 backdrop-blur-[3px] rounded-xl border shadow-[0px_5px_50px_2px_#59dea9]">
        {/* Header part ho yo */}
        <div className="flex justify-between items-center p-6 border-b border-gray-400/50">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-300">
              Signed in as{" "}
              <span className="font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {session?.user?.email}
              </span>
            </p>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-gray-400">
                {usersOnline.length} user{usersOnline.length !== 1 && "s"}{" "}
                online
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-600/70 hover:bg-red-500/80 text-gray-100 rounded-lg
              transition-all duration-200 font-medium text-sm hover:scale-[1.02]"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* README Popup ko lagi */}
        {showReadme && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-100">Chat Guide</h2>
                <button
                  onClick={() => setShowReadme(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-blue-400 mb-2">
                    Getting Started
                  </h3>
                  <p className="text-sm">
                    Open the same link in two different browsers. login with
                    different google account in both browsers, enjoy the chat
                    feature.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-green-400 mb-2">
                    Sending Messages
                  </h3>
                  <p className="text-sm">
                    Type your message in the input box and press Enter or click
                    'Send Message'. When message is sent by one account another
                    account will receive the message.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-purple-400 mb-2">
                    Online Status
                  </h3>
                  <p className="text-sm">
                    The green dot shows real-time online users. Numbers update
                    automatically.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">
                    Message History
                  </h3>
                  <p className="text-sm">
                    Scroll through the chat to view previous messages with
                    timestamps.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-400">
                    Note: All messages are not stored permanently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

{/*Chat Messages haru ko part ho hai*/}
        <div
          ref={chatContainerRef}
          className="p-4 h-[390px] sm:h-[430px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.user_name === session.user.email
                  ? "justify-end"
                  : "justify-start"
              } mb-4`}
            >
              <div className="flex items-start gap-3 max-w-[80%]">
                {msg.user_name !== session.user.email && (
                  <img
                    src={msg.avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full border-2 border-gray-600/50 hover:border-blue-400
                    transition-all duration-200 cursor-pointer"
                  />
                )}

                <div className="space-y-1">
                  <div
                    className={`p-4 rounded-2xl backdrop-blur-sm ${
                      msg.user_name === session.user.email
                        ? "bg-gradient-to-br from-blue-600/70 to-blue-600/80 border border-blue-400/20 rounded-br-none shadow-[0_4px_12px_rgba(34,197,94,0.1)]"
                        : "bg-gray-800/70 border border-gray-600/40 rounded-bl-none shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    }`}
                  >
                    <p className="text-gray-100 leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                  <p className="text-xs text-gray-300 px-2">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>

                {msg.user_name === session.user.email && (
                  <img
                    src={msg.avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full border-2 border-gray-600/50 hover:border-blue-400
                    transition-all duration-200 cursor-pointer order-last"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input ko part ho hai*/}
        <form
          onSubmit={sendMessage}
          className="p-4 border-t border-gray-400/50"
        >
          <div className="flex gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-5 py-3 bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600/50
              focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30
              transition-all duration-200 text-gray-100 placeholder-gray-400"
            />
            <button
              type="submit"
              className="px-6 py-3 z-30 bg-blue-800 hover:bg-blue-600 cursor-pointer text-white font-semibold rounded-xl
              transition-all duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg whitespace-nowrap
              disabled:opacity-80 disabled:hover:scale-100"
              disabled={!newMessage}
            >
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;



