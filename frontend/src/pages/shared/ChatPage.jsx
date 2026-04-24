import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatAPI } from "@/services/api";
import { useChat } from "@/hooks/useChat";
import { useUser } from "@/context/UserContext";
import { formatDate } from "@/lib/dateUtils";
import {
  ChatCircleText, PaperPlaneTilt as Send, ArrowLeft, Trash, CircleNotch,
} from "@phosphor-icons/react";
import { Button, Card, EmptyState, Input, PageTransition, ScrollArea, Separator } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);

  const otherUserId = selectedConversation
    ? currentUser?.id === selectedConversation.companyId?._id
      ? selectedConversation.vendorId?._id
      : selectedConversation.companyId?._id
    : null;
  const taskId = selectedConversation?.taskId?._id || selectedConversation?.taskId;

  const {
    messages, isConnected, otherUserTyping, loading: messagesLoading,
    sendMessage, sendTyping, markAsRead,
  } = useChat(taskId, otherUserId);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await chatAPI.getConversations();
        const data = res.data?.conversations || res.data;
        setConversations(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      } finally {
        setLoadingConversations(false);
      }
    };
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c._id === conversationId);
      if (conv) setSelectedConversation(conv);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && otherUserId) markAsRead();
  }, [selectedConversation, otherUserId, markAsRead]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    await sendMessage(messageText);
    setMessageText("");
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (selectedConversation?._id === convId) setSelectedConversation(null);
    } catch {
      // ignore
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    const basePath = `/${currentUser?.role}`;
    navigate(`${basePath}/messages/${conv._id}`);
  };

  const getOtherUser = (conv) => {
    if (!conv) return { username: "Unknown" };
    const isCompany = currentUser?.id === (conv.companyId?._id || conv.companyId);
    return isCompany
      ? conv.vendorId || { username: "Vendor" }
      : conv.companyId || { username: "Company" };
  };

  return (
    <PageTransition>
    <div className="space-y-8 h-full">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">Messages</h2>
        <p className="text-sm text-muted-foreground">Collaborate with stakeholders in real-time on task delivery and contract context.</p>
      </div>

      <div className="grid h-[calc(100vh-16rem)] grid-cols-1 gap-4 md:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className={`${selectedConversation ? "hidden md:flex" : "flex"} flex-col overflow-hidden`}>
          <Card.Header className="pb-3 border-b border-border/50">
            <Card.Title className="text-sm font-bold uppercase tracking-tight">Conversations</Card.Title>
            <Card.Description className="text-xs">All active task and contract threads.</Card.Description>
          </Card.Header>
          <ScrollArea className="flex-1">
            <Card.Content className="px-0 py-0">
                {loadingConversations ? (
                <div className="flex justify-center py-8"><CircleNotch className="w-6 h-6 animate-spin text-muted-foreground/70" /></div>
                ) : conversations.length === 0 ? (
                <EmptyState icon={ChatCircleText} title="No conversations yet" className="border-0 bg-transparent py-8 shadow-none" />
                ) : (
                conversations.map((conv) => {
                    const other = getOtherUser(conv);
                    const isSelected = selectedConversation?._id === conv._id;
                    return (
                    <div key={conv._id}>
                        <div
                            onClick={() => handleSelectConversation(conv)}
                            className={`flex cursor-pointer items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/50 ${isSelected ? "bg-muted" : ""}`}
                        >
                            <UserAvatar user={other} size="md" />
                            <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-foreground">{other.username}</p>
                            <p className="truncate text-xs text-muted-foreground font-medium">{conv.lastMessage || "No messages"}</p>
                            </div>
                            <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={(e) => handleDeleteConversation(conv._id, e)}
                            className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-danger hover:bg-danger-surface"
                            >
                            <Trash className="w-4 h-4" />
                            </Button>
                        </div>
                        <Separator className="opacity-50" />
                    </div>
                    );
                })
                )}
            </Card.Content>
          </ScrollArea>
        </Card>

        <Card className={`${selectedConversation ? "flex" : "hidden md:flex"} flex-col overflow-hidden shadow-soft`}>
          {selectedConversation ? (
            <>
              <Card.Header className="gap-3 border-b border-border/50 sm:flex-row sm:items-center sm:justify-between py-3 px-5">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setSelectedConversation(null)}
                    className="h-8 w-8 p-0 text-muted-foreground md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <UserAvatar user={getOtherUser(selectedConversation)} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-foreground uppercase tracking-tight">{getOtherUser(selectedConversation).username}</p>
                    {otherUserTyping ? <p className="text-[10px] font-bold text-success animate-pulse uppercase tracking-widest">typing...</p> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-success" : "bg-danger"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{isConnected ? "Connected" : "Offline"}</span>
                </div>
              </Card.Header>

              <ScrollArea className="flex-1 bg-muted/20 px-5">
                <Card.Content className="space-y-4 py-6 px-0 border-none shadow-none bg-transparent">
                    {messagesLoading ? (
                    <div className="flex justify-center py-8"><CircleNotch className="w-6 h-6 animate-spin text-muted-foreground/70" /></div>
                    ) : messages.length === 0 ? (
                    <EmptyState
                        icon={ChatCircleText}
                        title="No messages yet"
                        description="Send the first message to begin this conversation."
                        className="border-0 bg-transparent py-8 shadow-none"
                    />
                    ) : (
                    messages.map((msg, i) => {
                        const isMine = (msg.senderId?._id || msg.senderId) === currentUser?.id;
                        return (
                        <div key={msg._id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl border px-4 py-2.5 shadow-soft ${
                                isMine
                                ? "bg-foreground text-background border-transparent rounded-tr-none"
                                : "border-border/50 bg-card text-foreground rounded-tl-none"
                            }`}>
                            <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed">{msg.message}</p>
                            <p className={`mt-1 text-[9px] font-bold uppercase tracking-tight text-right ${isMine ? "text-white/60" : "text-muted-foreground/60"}`}>
                                {msg.createdAt ? formatDate(msg.createdAt) : ""}
                            </p>
                            </div>
                        </div>
                        );
                    })
                    )}
                    <div ref={messagesEndRef} />
                </Card.Content>
              </ScrollArea>

              <Separator />
              <Card.Footer className="p-4 bg-muted/30">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex w-full items-center gap-3"
                >
                  <Input
                    type="text"
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      sendTyping();
                    }}
                    placeholder="Type your message..."
                    className="flex-1 rounded-xl bg-card border-border/50 h-11"
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="h-11 w-11 rounded-xl px-0 shrink-0 shadow-soft active:scale-95 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </Card.Footer>
            </>
          ) : (
            <Card.Content className="flex flex-1 items-center justify-center bg-muted/10 px-0">
              <EmptyState
                icon={ChatCircleText}
                title="Select a conversation"
                description="Choose a conversation from the left to start chatting."
                className="border-0 bg-transparent py-8 shadow-none"
              />
            </Card.Content>
          )}
        </Card>
      </div>
    </div>
    </PageTransition>
  );
};

export default ChatPage;



