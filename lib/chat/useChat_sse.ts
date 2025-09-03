// DEPRECATED: SSE implementation disabled in favor of Appwrite real-time
// This file is kept for reference but should not be used
// Use useChat.ts instead for Appwrite real-time subscriptions

"use client";

import { useEffect, useRef, useState } from "react";

export type Role = "admin" | "patient";
type Msg = { text: string; from: Role | "system"; ts: number };

// DEPRECATED: Use useChat from useChat.ts instead  
export function useChatSSE_DEPRECATED(roomId: string, role: Role) {
    const eventSourceRef = useRef<EventSource | null>(null);

    const [adminOnline, setAdminOnline] = useState(false);
    const [approved, setApproved] = useState(false);
    const [pending, setPending] = useState(false);
    const [chatEnded, setChatEnded] = useState(false);
    const [denied, setDenied] = useState(false);

    const [messages, setMessages] = useState<Msg[]>([]);
    const [typingFrom, setTypingFrom] = useState<Role | null>(null);
    const [unread, setUnread] = useState(0);

    // Inactivity timeout for patient only
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [inactivityMinutes, setInactivityMinutes] = useState(0);

    useEffect(() => {
        console.log(`useChat: Starting connection for ${role} in room ${roomId}`);

        const connectToChat = async () => {
            // Close any existing connection first to prevent conflicts
            if (eventSourceRef.current) {
                console.log(`useChat: Closing existing connection for ${role} in room ${roomId}`);
                if (eventSourceRef.current.readyState !== EventSource.CLOSED) {
                    eventSourceRef.current.close();
                }
                eventSourceRef.current = null;

                // Small delay to ensure cleanup completes
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const url = `${window.location.origin}/api/chat?role=${role}&roomId=${roomId}`;
            console.log(`useChat: Connecting to ${url}`);

            const eventSource = new EventSource(url);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log(`useChat: SSE connected for ${role}`);
            };

            eventSource.onmessage = (event) => {
                console.log(`useChat: ${role} received:`, event.data);
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === "presence") {
                        console.log(`useChat: ${role} received presence update:`, data.adminOnline);
                        setAdminOnline(data.adminOnline);
                    } else if (data.type === "approved") {
                        console.log(`useChat: ${role} APPROVED - setting approved=true, pending=false`);
                        setApproved(true);
                        setPending(false);
                    } else if (data.type === "denied") {
                        console.log(`useChat: ${role} DENIED - setting denied=true, approved=false, pending=false`);
                        setDenied(true);
                        setApproved(false);
                        setPending(false);
                    } else if (data.type === "message") {
                        // Only add message if it's from the other party (avoid duplicates)
                        if (data.from !== role) {
                            console.log(`useChat: ${role} received message from other party:`, data);
                            setMessages(prev => [...prev, data]);
                            setUnread(prev => prev + 1);
                        } else {
                            console.log(`useChat: ${role} ignoring own message from server to avoid duplicate`);
                        }
                    } else if (data.type === "end") {
                        console.log(`useChat: ${role} received end message - chat ended by admin`);
                        setChatEnded(true);
                        setPending(false);
                        // Clear messages when chat ends to provide clean slate
                        setMessages([]);
                        setUnread(0);
                    } else if (data.type === "typing") {
                        console.log(`useChat: ${role} received typing indicator:`, data);
                        if (data.from !== role) {
                            setTypingFrom(data.isTyping ? data.from : null);
                        }
                    } else if (data.type === "heartbeat") {
                        // Ignore heartbeat messages, just used to test connection
                        console.log(`useChat: ${role} received heartbeat`);
                    }
                } catch (error) {
                    console.error(`useChat: Error parsing message for ${role}:`, error);
                }
            };

            eventSource.onerror = (error) => {
                console.error(`useChat: SSE error for ${role} in room ${roomId}:`, error);
                // Don't automatically reconnect - let the user refresh if needed
                // This prevents infinite reconnection loops that can cause server overload
            };
        };

        // Call the async connection function
        connectToChat();

        return () => {
            console.log(`useChat: Cleanup for ${role} in room ${roomId}`);
            if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [roomId, role]);

    // Start inactivity timer when chat is approved (patient only)
    useEffect(() => {
        if (role === "patient" && approved && !chatEnded && !denied) {
            console.log(`useChat: Starting inactivity timer for approved patient chat`);
            resetInactivityTimer();
        }

        // Cleanup on unmount or state changes
        return () => {
            if (inactivityTimerRef.current) {
                clearInterval(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        };
    }, [approved, chatEnded, denied, role]);

    const request = (user: { id: string; name: string }) => {
        console.log(`useChat: ${role} sending request for room ${roomId}`);
        fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "request",
                roomId,
                user
            })
        });
        console.log(`useChat: ${role} setting pending=true`);
        setPending(true);
    };

    const sendMessage = (text: string) => {
        // Add message to local state immediately so sender can see it
        const newMessage = {
            text,
            from: role,
            ts: Date.now()
        };
        console.log(`useChat: ${role} adding message to local state:`, newMessage);
        setMessages(prev => [...prev, newMessage]);

        // Reset inactivity timer for patients
        if (role === "patient") {
            resetInactivityTimer();
        }

        // Send to server
        fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "message",
                roomId,
                text,
                from: role
            })
        });
    };

    const sendTyping = (isTyping: boolean) => {
        fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "typing",
                roomId,
                from: role,
                isTyping
            })
        });
    };

    const end = () => {
        fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "end",
                roomId
            })
        });
    };

    const clearUnread = () => {
        setUnread(0);
    };

    // Reset inactivity timer
    const resetInactivityTimer = () => {
        if (role === "patient" && approved && !chatEnded && !denied) {
            // Clear existing timer first
            if (inactivityTimerRef.current) {
                clearInterval(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }

            console.log(`useChat: Resetting inactivity timer for patient`);
            setInactivityMinutes(0);

            // Start new timer
            inactivityTimerRef.current = setInterval(() => {
                setInactivityMinutes(prev => {
                    const newMinutes = prev + 1;
                    console.log(`useChat: Inactivity check - minute ${newMinutes}`);

                    // Send automated messages at 1-4 minutes (only once per minute)
                    if (newMinutes >= 1 && newMinutes <= 4) {
                        const messages = [
                            "Are you still there?",
                            "Please respond if you need assistance",
                            "This chat will end soon due to inactivity",
                            "Chat will end in 1 minute"
                        ];

                        const systemMessage = {
                            text: messages[newMinutes - 1],
                            from: "system" as const,
                            ts: Date.now()
                        };

                        console.log(`useChat: Adding timeout message for minute ${newMinutes}:`, systemMessage.text);
                        setMessages(prev => {
                            // Prevent duplicate messages by checking if last message is the same
                            const lastMsg = prev[prev.length - 1];
                            if (lastMsg && lastMsg.from === "system" && lastMsg.text === systemMessage.text) {
                                console.log(`useChat: Preventing duplicate system message`);
                                return prev;
                            }
                            return [...prev, systemMessage];
                        });
                    }

                    // Auto-end at 5 minutes
                    if (newMinutes >= 5) {
                        console.log(`useChat: Auto-ending chat due to 5 minutes inactivity`);

                        // Send end message to server to notify admin
                        fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                type: "end",
                                roomId
                            })
                        });

                        setChatEnded(true);
                        if (inactivityTimerRef.current) {
                            clearInterval(inactivityTimerRef.current);
                            inactivityTimerRef.current = null;
                        }
                        return 0;
                    }

                    return newMinutes;
                });
            }, 60000); // Check every minute
        }
    };

    const refresh = () => {
        console.log(`useChat: ${role} refreshing chat - resetting all states`);

        // Clear inactivity timer
        if (inactivityTimerRef.current) {
            clearInterval(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }

        setApproved(false);
        setPending(false);
        setChatEnded(false);
        setDenied(false);
        setMessages([]);
        setUnread(0);
        setInactivityMinutes(0);
    };

    return {
        adminOnline,
        approved,
        pending,
        chatEnded,
        denied,
        messages,
        typingFrom,
        unread,
        request,
        sendMessage,
        sendTyping,
        end,
        clearUnread,
        refresh
    };
}