import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { chatAPI } from "@/services/api";
import { useChat } from "@/hooks/useChat";
import { useUser } from "@/context/UserContext";
import { formatDate } from "@/lib/dateUtils";
import { 
  PaperPlaneTilt, 
  CircleNotch, 
  User as UserIcon, 
  ArrowLeft,
  MagnifyingGlass,
  Check,
  Checks
} from "@phosphor-icons/react";
import { 
  Button, 
  PageTransition, 
  Card, 
  Input, 
  Avatar, 
  AvatarImage, 
  AvatarFallback,
  Badge,
  ScrollArea,
  Skeleton
} from "@/components/ui";
import { cn } from "@/lib/cn";

const ChatPage = () => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTaskId = searchParams.get("taskId");
  
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activePartner, setActivePartner] = useState(null);
  
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);

  const { 
    messages, 
    sendMessage, 
    sendTyping, 
    loading: loadingMessages, 
    isConnected,
    otherUserTyping 
  } = useChat(activeTaskId, activePartner?.partnerId);

  const loadPartners = async () => {
    try {
      const res = await chatAPI.getPartners();
      const partnersData = res.data?.data || [];
      setPartners(partnersData);
      
      if (activeTaskId && !activePartner) {
        const current = partnersData.find(p => p.taskId === activeTaskId);
        if (current) setActivePartner(current);
      }
    } catch (err) {
      console.error("Failed to load partners", err);
    } finally {
      setLoadingPartners(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  // Effect to reset chat when URL param is removed
  useEffect(() => {
    if (!activeTaskId) {
      setActivePartner(null);
    }
  }, [activeTaskId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handlePartnerSelect = (partner) => {
    setActivePartner(partner);
    setSearchParams({ taskId: partner.taskId });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(newMessage.trim());
    setNewMessage("");
  };

  const filteredPartners = partners.filter(p => 
    (p.partnerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (p.taskTitle?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="h-[calc(100vh-180px)] flex gap-4 overflow-hidden">
        {/* Partners List */}
        <div className={cn(
          "w-full md:w-80 flex flex-col bg-card border border-border rounded-xl overflow-hidden shrink-0",
          activePartner ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4">Messages</h2>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search partners or tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loadingPartners ? (
                <div className="p-2 space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-relaxed">No active chat partners found</p>
                </div>
              ) : (
                filteredPartners.map((partner) => (
                  <button
                    key={partner.taskId}
                    onClick={() => handlePartnerSelect(partner)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group",
                      activePartner?.taskId === partner.taskId 
                        ? "bg-primary text-primary-foreground shadow-soft" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Avatar className="h-10 w-10 border-2 border-background shrink-0">
                      <AvatarImage src={partner.partnerImage} />
                      <AvatarFallback><UserIcon /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className={cn(
                          "text-[11px] font-black uppercase tracking-tight truncate",
                          activePartner?.taskId === partner.taskId ? "text-primary-foreground" : "text-foreground"
                        )}>{partner.partnerName}</p>
                        <span className={cn(
                          "text-[9px] font-bold opacity-60",
                          activePartner?.taskId === partner.taskId ? "text-primary-foreground" : "text-muted-foreground"
                        )}>{partner.lastMessageAt ? formatDate(partner.lastMessageAt) : ""}</span>
                      </div>
                      <p className={cn(
                        "text-[9px] font-bold uppercase tracking-widest truncate mb-1 opacity-80",
                        activePartner?.taskId === partner.taskId ? "text-primary-foreground/90" : "text-primary"
                      )}>{partner.taskTitle}</p>
                      <p className={cn(
                        "text-[11px] truncate leading-tight opacity-70",
                        activePartner?.taskId === partner.taskId ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>{partner.lastMessage || "No messages yet"}</p>
                    </div>
                    {partner.unreadCount > 0 && activePartner?.taskId !== partner.taskId && (
                      <Badge variant="primary" className="ml-2 px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black animate-pulse">
                        {partner.unreadCount}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden",
          !activePartner ? "hidden md:flex items-center justify-center bg-muted/5" : "flex"
        )}>
          {!activePartner ? (
            <div className="text-center p-8">
              <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                <PaperPlaneTilt className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Your Conversations</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-2 max-w-[200px] mx-auto leading-relaxed">
                Select a partner from the left to start coordinating on your active projects.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 mr-1"
                    onClick={() => setActivePartner(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={activePartner.partnerImage} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight text-foreground leading-none">{activePartner.partnerName}</p>
                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1.5">{activePartner.taskTitle}</p>
                    {otherUserTyping && (
                      <p className="text-[10px] text-primary animate-pulse font-bold mt-1 tracking-tighter uppercase italic">typing...</p>
                    )}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-background shadow-xs">
                    {activePartner.contractStatus}
                  </Badge>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 bg-muted/5 p-4 sm:p-6">
                <div className="space-y-6 max-w-4xl mx-auto">
                  {loadingMessages ? (
                    <div className="space-y-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={cn("flex flex-col max-w-[70%]", i % 2 === 0 ? "ml-auto items-end" : "items-start")}>
                          <Skeleton className={cn("h-12 w-full rounded-xl", i % 2 === 0 ? "rounded-br-none" : "rounded-bl-none")} />
                          <Skeleton className="h-2 w-16 mt-2" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Encryption Secured • Conversation Start</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                      return (
                        <div
                          key={msg._id || i}
                          className={cn(
                            "flex flex-col max-w-[85%] sm:max-w-[70%]",
                            isMe ? "ml-auto items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "px-4 py-3 rounded-xl text-[13px] leading-relaxed shadow-xs",
                            isMe 
                              ? "bg-primary text-primary-foreground rounded-br-none" 
                              : "bg-background border border-border rounded-bl-none"
                          )}>
                            {msg.message}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 px-1">
                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                              {formatDate(msg.createdAt)}
                            </span>
                            {isMe && (
                              msg.read ? (
                                <Checks className="h-3 w-3 text-primary" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground/40" />
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-background">
                <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto relative">
                  {!isConnected && (
                    <div className="absolute -top-10 left-0 right-0 text-center">
                       <Badge variant="destructive" className="text-[8px] uppercase tracking-widest px-2 py-0.5 animate-pulse shadow-soft">Reconnecting to session...</Badge>
                    </div>
                  )}
                  <Input
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      sendTyping();
                    }}
                    placeholder="Coordinate and discuss project milestones..."
                    className="flex-1 rounded-full px-6 py-6 text-sm bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/40 placeholder:uppercase placeholder:text-[10px] placeholder:font-bold placeholder:tracking-widest"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-12 px-6 rounded-xl shrink-0 shadow-soft"
                    disabled={!newMessage.trim() || !isConnected}
                  >
                    SEND
                  </Button>                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default ChatPage;

