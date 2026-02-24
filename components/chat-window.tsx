"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Send } from "lucide-react";
import { format, isToday, isThisYear } from "date-fns";

export function ChatWindow({ conversationId }: { conversationId: any }) {
  const [messageText, setMessageText] = useState("");
  
  // Get data
  const messages = useQuery(api.messages.list, { conversationId });
  const currentUser = useQuery(api.users.getMe); // We'll create this next
  const sendMessage = useMutation(api.messages.send);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    await sendMessage({ body: messageText, conversationId });
    setMessageText("");
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    if (isToday(date)) return format(date, "h:mm a");
    if (isThisYear(date)) return format(date, "MMM d, h:mm a");
    return format(date, "MMM d, yyyy, h:mm a");
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5]">
        {messages?.map((msg) => {
          const isMe = msg.senderId === currentUser?._id;
          
          return (
            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-lg shadow-sm ${
                isMe ? "bg-[#dcf8c6] text-gray-800 rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none"
              }`}>
                <p className="text-sm">{msg.body}</p>
                <p className={`text-[10px] mt-1 text-right opacity-60`}>
                  {formatTimestamp(msg._creationTime)}
                </p>
              </div>
            </div>
          );
        })}

        {messages?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <div className="bg-blue-100 p-4 rounded-full mb-4">💬</div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Send a message to start the conversation!</p>
          </div>
        )}

      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-gray-100 flex gap-2 items-center">
        <input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message"
          className="flex-1 rounded-lg px-4 py-2 focus:outline-none"
        />
        <button type="submit" className="text-gray-500 hover:text-blue-600">
          <Send className="h-6 w-6" />
        </button>
      </form>
    </div>
  );
}