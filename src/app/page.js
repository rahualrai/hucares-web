'use client'
import styles from './page.module.css'
import { useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { TypeAnimation } from 'react-type-animation'
import { SyncLoader } from 'react-spinners'
import useEventListener from '@use-it/event-listener'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  const [recentChats, setRecentChats] = useState([])
  const [currentChat, setCurrentChat] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)


  // FAQ prompts
  const [faqs, setFaqs] = useState([
    'Do International Students need to submit SAT scores?',
    'What is the application deadline for 2024?',
  ]);

  // Handle keydown for submitting search on Enter
  const handleKeyDown = (event) => {
    if (event.keyCode === 13 && !loading) {
      submitSearch();
    }
  };

  useEventListener('keydown', handleKeyDown);

  // Function to handle starting a new chat
  const newChatFunction = () => {
    setRecentChats([...recentChats, currentChat]);
    setCurrentChat([]);
  };

  // Function to populate current chat with a chat from history
  const populateCurrentChat = (index) => {
    setCurrentChat(recentChats[index]);
  };

  // Main submit search function updated to use Flask API
  const submitSearch = async () => {
    if (input === '') return;

    setLoading(true);

    const payload = {
      current_chat: input,
      history: recentChats,
    };

    setCurrentChat([...currentChat, { role: 'user', content: input }]);
    setInput('');

    try {
      const response = await fetch('https://hucares-528eecef3292.herokuapp.com/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      setCurrentChat([...currentChat, { role: 'assistant', content: data.openai_response }]);
    } catch (error) {
      console.error('API call failed:', error);
      setCurrentChat([...currentChat, { role: 'assistant', content: 'Sorry, there was an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.left}>
        <div className="flex p-8 text-3xl">Bison Connect</div>
        <div className={styles.chats}>
          <button className={styles.newChat} onClick={newChatFunction}>
            <p>New Chat</p>
            <AddIcon />
          </button>
          <h3>Recent Chats</h3>
          <div className={styles.newChats}>
            {recentChats.map((chat, index) => (
              <div
                className={styles.chat}
                key={index}
                onClick={() => populateCurrentChat(index)}
              >
                <p>
                  {chat.length > 0
                    ? chat[0]?.content.substring(0, 24) + '...'
                    : 'New Chat'}
                </p>
                <KeyboardArrowRightIcon />
              </div>
            ))}
          </div>
        </div>
        <div className=" bottom-0 sticky items-center justify-between space-x-40 flex flex-row mt-auto p-8 text-3xl">
          <div>
            <Link href="https://discord.gg/9K79b8B3Y7">
              <Image
                src="/discord.png"
                alt="Discord Image"
                width={50}
                height={50}
              />
            </Link>
          </div>
          <div>
            <Link href="https://groupme.com/join_group/86671176/dyJFyIMO">
              <Image
                src="/groupme.png"
                alt="Group Me Image"
                width={50}
                height={50}
              />
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        {currentChat.length == 0 ? (
          <div className={styles.faq}>
            {faqs.map((faq) => (
              <div
                key={faqs}
                className={styles.faqItem}
                onClick={() => {
                  //first call set input, then submit search after set input
                  setInput(faq)
                }}
              >
                <h5>Popular Question</h5>
                <p>{faq}</p>
                <ArrowForwardIcon />
              </div>
            ))}
          </div>
        ) : null}
        {currentChat.length > 0 &&(

          <div className={styles.chatbubbles} id="chatbubbles">
            {currentChat.map((chat) => {
              if (chat.role == 'user') {
                return (
                  <div key={chat} className={styles.userchat}>
                    <h5>You</h5>
                    <p>{chat.content}</p>
                  </div>
                )
              } else {
                return (
                  <div key={chat} className={styles.botchat}>
                    <div className={styles.botchattitle}>
                      <Image width={80} height={80} src="/logo.png" alt="1" />
                      <h5>Bison Buddy</h5>
                    </div>
                    <ReactMarkdown className={styles.markdown}>
                      {chat.content}
                    </ReactMarkdown>
                  </div>
                )
              }
            })}
            {loading && (
              <SyncLoader loading={loading} size={14} color="#c3dff5" />
            )}
            <div id="anchor"></div>;
          </div>
        )}
        {currentChat.length == 0 ? (
          <div className=" w-[300px] h-[300px] translate-x-[480px] -translate-y-96  relative">
            <Image src="/logo.png" alt="My Image" fill />
            <p className="translate-y-48 translate-x-10 text-xl font-bold">
              <TypeAnimation
                sequence={[
                  'Welcome to Bison Connect',
                  'Ask me anything about Howard University',
                  'I am here to help you',
                ]}
                wrapper="span"
                speed={0}
                delay={1000}
                repeat={Infinity}
              />
            </p>
          </div>
        ) : null}
        <div className={styles.bottomchat}>
          <div className={styles.bottomchatcontainer}>
            <input
              type="text"
              placeholder="Message Bison Connect......."
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
              }}
            />
            <button className=" -translate-x-10 " onClick={submitSearch}>
              <ArrowForwardIcon />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
