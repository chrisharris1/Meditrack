"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { client, databases } from "@/lib/appwrite.client";
import { usePolling } from "@/lib/chat/usePolling";
import {
  createChatRoom,
  getChatRoom,
  sendChatMessage,
  getChatMessages,
  updateUserPresence,
  isAdminOnline,
  approveChatRequest,
  denyChatRequest,
  endChatSession,
  markMessagesAsRead,
  getUnreadMessageCount,
  cleanupChatRoom
} from "@/lib/actions/chat.actions";
import {
  CLIENT_DATABASE_ID,
  CLIENT_CHAT_ROOMS_COLLECTION_ID,
  CLIENT_CHAT_MESSAGES_COLLECTION_ID,
  CLIENT_CHAT_PRESENCE_COLLECTION_ID
} from "@/lib/appwrite.client";

export type Role = "admin" | "patient";
type Msg = { text: string; from: Role | "system"; ts: number };

export function useChat(roomId: string, role: Role) {
  // 🔧 STATE RESET: Reset all state when roomId changes
  const [adminOnline, setAdminOnline] = useState(false);
  const [approved, setApproved] = useState(false);
  const [pending, setPending] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [denied, setDenied] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typingFrom, setTypingFrom] = useState<Role | null>(null);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [endedBy, setEndedBy] = useState<"admin" | "patient" | null>(null);
// 🔧 INACTIVITY TIMEOUT SYSTEM (Client-side only - no database)
const [inactivityMinutes, setInactivityMinutes] = useState(0);
const [showInactivityWarning, setShowInactivityWarning] = useState(false);
const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

// 🔧 TYPING INDICATOR TIMEOUT (Fallback mechanism)
const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// 🔧 INACTIVITY WARNING TIMEOUTS (Store all warning timeouts)
const warningTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

// 🔧 AUTO-END FLAG (Prevent cleanup from clearing auto-end timer)
const isAutoEndingRef = useRef(false);

// 🔧 STATE RESET: Reset all state when roomId changes (new user login)
useEffect(() => {
  console.log(`🔄 [${role}] RoomId changed to ${roomId} - resetting all state for new user`);

  // Reset all state to initial values
  setAdminOnline(false);
  setApproved(false);
  setPending(false);
  setChatEnded(false);
  setDenied(false);
  setMessages([]);
  setTypingFrom(null);
  setUnread(0);
  setRefreshing(false);
  setEndedBy(null);

  // Reset inactivity state
  setInactivityMinutes(0);
  setShowInactivityWarning(false);

  // Reset auto-ending flag
  isAutoEndingRef.current = false;

  // Clear all timers
  if (inactivityTimerRef.current) {
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = null;
  }
  if (warningTimerRef.current) {
    clearTimeout(warningTimerRef.current);
    warningTimerRef.current = null;
  }
  warningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
  warningTimeoutsRef.current = [];

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
  }

  console.log(`✅ [${role}] State reset complete for new user ${roomId}`);
}, [roomId, role]); // This effect runs when roomId or role changes

  // Polling fallback for checking room status
  const pollRoomStatus = useCallback(async () => {
    try {
      console.log(`🔄 [${role}] Polling room status for ${roomId}`);
      const room = await getChatRoom(roomId);
      
      if (room) {
        console.log(`🔄 [${role}] Room found with status: ${room.status}`);
        // For polling, also treat "ended" rooms as fresh starts for new user sessions
        if (room.status === "ended") {
          console.log(`🔄 [${role}] Polling found ended room ${roomId} - treating as fresh start`);
          setChatEnded(false);
          setApproved(false);
          setPending(false);
          setDenied(false);
        } else {
          switch (room.status) {
            case "pending":
              setPending(true);
              setApproved(false);
              setDenied(false);
              setChatEnded(false);
              break;
            case "active":
              setApproved(true);
              setPending(false);
              setDenied(false);
              setChatEnded(false);
              break;
            case "denied":
              setDenied(true);
              setPending(false);
              setApproved(false);
              setChatEnded(false);
              break;
          }
        }
      } else {
        console.log(`🆕 [${role}] No room found for ${roomId} - fresh start for new user`);
        // For new users, don't set chatEnded - let them start fresh
        setChatEnded(false);
        setApproved(false);
        setPending(false);
        setDenied(false);
        setMessages([]);
        setEndedBy(null);
      }
    } catch (error) {
      console.error(`❌ [${role}] Error polling room status:`, error);
    }
  }, [roomId, role]);

  // Smart polling strategy: Only when real-time fails and chat is active
  const shouldPollRoomStatus = !chatEnded && !denied;
  // Increased interval for room status polling - rely more on real-time
  usePolling(shouldPollRoomStatus ? pollRoomStatus : null, 30000); // 30s intervals

  // Polling for messages when room is active - optimized
  const pollMessages = useCallback(async () => {
    if (approved && !chatEnded) {
      try {
        const existingMessages = await getChatMessages(roomId);
        const formattedMessages = existingMessages.map(msg => ({
          text: msg.messageText,
          from: msg.senderRole as Role | "system",
          ts: msg.timestamp.getTime()
        }));
        
        // Only update if messages changed
        if (formattedMessages.length !== messages.length) {
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error(`${role}: Error polling messages:`, error);
      }
    }
  }, [roomId, role, approved, chatEnded, messages.length]);

  // Message polling: Less frequent, rely primarily on real-time subscriptions
  const shouldPollMessages = approved && !chatEnded;
  usePolling(shouldPollMessages ? pollMessages : null, 1000); // 15s intervals

  // Initialize chat room and load messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log(`🚀 [${role}] Initializing chat for roomId: ${roomId}`);

        // Update user presence
        await updateUserPresence({
          userId: roomId,
          role: role,
          isOnline: true,
          currentRoomId: roomId
        });

        // Check if chat room exists and get its status
        const room = await getChatRoom(roomId);
        if (room) {
          console.log(`📋 [${role}] Found existing room ${roomId} with status: ${room.status}`);

          // For new user sessions, treat "ended" rooms as non-existent to allow fresh start
          if (room.status === "ended") {
            console.log(`🔄 [${role}] Room ${roomId} was ended - treating as fresh start for new user session`);
            // Don't load any state - let the user start fresh
            setChatEnded(false);
            setApproved(false);
            setPending(false);
            setDenied(false);
            setMessages([]);
            setEndedBy(null);
          } else {
            // Handle active rooms normally
            switch (room.status) {
              case "pending":
                setPending(true);
                break;
              case "active":
                setApproved(true);
                setPending(false);
                break;
              case "denied":
                setDenied(true);
                setPending(false);
                break;
            }

            // Load existing messages if room is active
            if (room.status === "active") {
              const existingMessages = await getChatMessages(roomId);
              const formattedMessages = existingMessages.map(msg => ({
                text: msg.messageText,
                from: msg.senderRole as Role | "system",
                ts: msg.timestamp.getTime()
              }));
              setMessages(formattedMessages);

              // Get unread count
              const unreadCount = await getUnreadMessageCount(roomId, role);
              setUnread(unreadCount);
            }
          }
        }

        // Check admin online status
        const adminOnlineStatus = await isAdminOnline();
        setAdminOnline(adminOnlineStatus);

      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initializeChat();
  }, [roomId, role]);

  // Subscribe to chat room changes (approval, denial, end)
  useEffect(() => {
    console.log(`🔍 [${role}] Setting up room subscription for roomId: ${roomId}`);
    console.log(`📡 Subscription channel: databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_ROOMS_COLLECTION_ID}.documents`);
    
    const unsubscribeRoom = client.subscribe(
      [
        `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_ROOMS_COLLECTION_ID}.documents`,
        `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_ROOMS_COLLECTION_ID}.documents.*.update`
      ],
      (response: any) => {
        try {
          console.log(`📨 [${role}] Room update received:`, response);
          console.log(`🔎 [${role}] Checking if payload.roomId (${response.payload?.roomId}) === current roomId (${roomId})`);
          
          if (response.payload && response.payload.roomId === roomId) {
            const status = response.payload.status;
            console.log(`✅ [${role}] Room ${roomId} status changed to: ${status}`);
            
            // Handle "ended" status - since endedBy field is not in Appwrite schema,
            // we treat all "ended" statuses as manual ends (user/admin ended the chat)
            if (status === "ended") {
              console.log(`🔚 [${role}] Chat ended - treating as manual end`);
              setChatEnded(true);
              setApproved(false);
              setPending(false);
              setDenied(false);
              setEndedBy(role); // Assume current user ended it
            } else {
              switch (status) {
                case "active":
                  console.log(`🟢 [${role}] Setting approved=true, pending=false`);
                  setApproved(true);
                  setPending(false);
                  setDenied(false);
                  setChatEnded(false);
                  break;
                case "denied":
                  console.log(`🔴 [${role}] Setting denied=true`);
                  setDenied(true);
                  setPending(false);
                  setApproved(false);
                  break;
              }
            }
          } else {
            console.log(`❌ [${role}] Room update ignored - roomId mismatch or no payload`);
          }
        } catch (error) {
          console.error(`🚨 [${role}] Error processing room update:`, error);
        }
      }
    );

    return () => {
      if (typeof unsubscribeRoom === 'function') {
        unsubscribeRoom();
      }
    };
  }, [roomId]);

  // Subscribe to new messages - more specific subscription
  useEffect(() => {
    console.log(`Setting up message subscription for ${roomId}`);
    
    const unsubscribeMessages = client.subscribe(
      [
        `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_MESSAGES_COLLECTION_ID}.documents`,
        `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_MESSAGES_COLLECTION_ID}.documents.*.create`
      ],
      (response: any) => {
        try {
          console.log("Message update received:", response);
          
          if (response.payload && response.payload.roomId === roomId) {
            const newMessage = {
              text: response.payload.messageText,
              from: response.payload.senderRole as Role | "system",
              ts: new Date(response.payload.timestamp).getTime()
            };
            
            // Only add if it's from someone else (avoid duplicates)
            if (newMessage.from !== role) {
              console.log(`Adding new message from ${newMessage.from}:`, newMessage);
              setMessages(prev => {
                // Prevent duplicate messages
                const isDuplicate = prev.some(msg => 
                  msg.text === newMessage.text && 
                  msg.from === newMessage.from && 
                  Math.abs(msg.ts - newMessage.ts) < 1000
                );
                if (isDuplicate) return prev;
                return [...prev, newMessage];
              });
              setUnread(prev => prev + 1);
            }
          }
        } catch (error) {
          console.error(`🚨 [${role}] Error processing message update:`, error);
        }
      }
    );

    return () => {
      if (typeof unsubscribeMessages === 'function') {
        unsubscribeMessages();
      }
    };
  }, [roomId, role]);

  // Subscribe to presence changes - only when chat is active
  useEffect(() => {
    // Don't subscribe to presence if chat is in terminal state
    if (chatEnded || denied) {
      console.log(`Presence subscription disabled - chat ${chatEnded ? 'ended' : 'denied'}`);
      return;
    }

    console.log(`Setting up presence subscription`);
    
    const unsubscribePresence = client.subscribe(
      `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_PRESENCE_COLLECTION_ID}.documents`,
      (response: any) => {
        try {
          console.log("Presence update received:", response);
          
          if (response.payload) {
            // Handle admin online status
            if (response.payload.role === "admin") {
              setAdminOnline(response.payload.isOnline);
              console.log(`Admin online status: ${response.payload.isOnline}`);
            }
            
            // Handle typing indicators for the opposite role
            const oppositeRole = role === "admin" ? "patient" : "admin";
            if (response.payload.role === oppositeRole && response.payload.currentRoomId === roomId) {
              if (response.payload.isTyping) {
                setTypingFrom(oppositeRole);
                console.log(`${oppositeRole} is typing in room ${roomId}`);

                // Set a fallback timeout to clear typing indicator after 10 seconds
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                  console.log(`⏰ [${role}] Typing timeout - clearing typing indicator for ${oppositeRole}`);
                  setTypingFrom(prev => prev === oppositeRole ? null : prev);
                }, 10000); // 10 second fallback
              } else {
                // Clear typing indicator and timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = null;
                }
                setTypingFrom(prev => prev === oppositeRole ? null : prev);
                console.log(`${oppositeRole} stopped typing in room ${roomId}`);
              }
            } else if (response.payload.role === oppositeRole && response.payload.currentRoomId !== roomId) {
              // Clear typing if the person moved to a different room
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
              }
              setTypingFrom(prev => prev === oppositeRole ? null : prev);
            }
          }
        } catch (error) {
          console.error(`🚨 [${role}] Error processing presence update:`, error);
        }
      }
    );

    return () => {
      if (typeof unsubscribePresence === 'function') {
        unsubscribePresence();
      }
    };
  }, [role, roomId, chatEnded, denied]);

  // 🔧 INACTIVITY MANAGEMENT FUNCTIONS (Client-side only)
  const resetInactivityTimer = useCallback(() => {
    console.log(`🔄 [${role}] Resetting inactivity timer`);

    // Don't reset if chat has ended due to auto-timeout
    if (chatEnded && isAutoEndingRef.current) {
      console.log(`🚫 [${role}] Not resetting timer - chat ended due to auto-timeout`);
      return;
    }

    // Clear existing timers
    if (inactivityTimerRef.current) {
      console.log(`🧹 [${role}] Clearing auto-end timer`);
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      console.log(`🧹 [${role}] Clearing warning timer`);
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    // Clear all warning timeouts
    warningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    warningTimeoutsRef.current = [];

    // Reset state
    setInactivityMinutes(0);
    setShowInactivityWarning(false);

    // Only start timer for patients (not admins)
    if (role === "patient" && approved && !chatEnded && !denied) {
      startInactivityWarnings();
    }
  }, [role, approved, chatEnded, denied]);

  const startInactivityWarnings = useCallback(() => {
    console.log(`⏰ [${role}] Starting inactivity warning system`);

    // Clear any existing timers first
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Clear all warning timeouts
    warningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    warningTimeoutsRef.current = [];

    // Warning at 1 minute
    const warning1 = setTimeout(() => {
      if (approved && !chatEnded && !denied) {
        console.log(`⚠️ [${role}] 1 minute inactivity warning`);
        setInactivityMinutes(1);
        setShowInactivityWarning(true);

        const warningMessage = {
          text: "Are you still there?",
          from: "system" as const,
          ts: Date.now()
        };
        setMessages(prev => [...prev, warningMessage]);
      }
    }, 60000); // 1 minute
    warningTimeoutsRef.current.push(warning1);

    // Warning at 2 minutes
    const warning2 = setTimeout(() => {
      if (approved && !chatEnded && !denied) {
        console.log(`⚠️ [${role}] 2 minute inactivity warning`);
        setInactivityMinutes(2);

        const warningMessage = {
          text: "Please respond if you need assistance",
          from: "system" as const,
          ts: Date.now()
        };
        setMessages(prev => [...prev, warningMessage]);
      }
    }, 120000); // 2 minutes
    warningTimeoutsRef.current.push(warning2);

    // Warning at 3 minutes
    const warning3 = setTimeout(() => {
      if (approved && !chatEnded && !denied) {
        console.log(`⚠️ [${role}] 3 minute inactivity warning`);
        setInactivityMinutes(3);

        const warningMessage = {
          text: "This chat will end soon due to inactivity",
          from: "system" as const,
          ts: Date.now()
        };
        setMessages(prev => [...prev, warningMessage]);
      }
    }, 180000); // 3 minutes
    warningTimeoutsRef.current.push(warning3);

    // Warning at 4 minutes
    const warning4 = setTimeout(() => {
      if (approved && !chatEnded && !denied) {
        console.log(`⚠️ [${role}] 4 minute inactivity warning`);
        setInactivityMinutes(4);

        const warningMessage = {
          text: "Chat will end in 1 minute",
          from: "system" as const,
          ts: Date.now()
        };
        setMessages(prev => [...prev, warningMessage]);
      }
    }, 240000); // 4 minutes
    warningTimeoutsRef.current.push(warning4);

    // Auto-end at 5 minutes
    inactivityTimerRef.current = setTimeout(() => {
      console.log(`⏰ [${role}] 5-minute auto-end timer fired`);
      if (approved && !chatEnded && !denied) {
        console.log(`🔚 [${role}] Auto-ending chat due to 5 minutes inactivity`);
        setInactivityMinutes(5);
        isAutoEndingRef.current = true; // Set flag to prevent cleanup
        end(); // This triggers chatEnded = true
      } else {
        console.log(`⚠️ [${role}] Auto-end timer fired but conditions not met: approved=${approved}, chatEnded=${chatEnded}, denied=${denied}`);
      }
    }, 300000); // 5 minutes
    console.log(`🎯 [${role}] Auto-end timer set for 5 minutes from now`);
  }, [role, approved, chatEnded, denied]);

  // Start inactivity timer when chat becomes approved
  useEffect(() => {
    if (role === "patient" && approved && !chatEnded && !denied) {
      console.log(`🚀 [${role}] Chat approved - starting inactivity timer`);
      resetInactivityTimer();
    }
  }, [role, approved, chatEnded, denied, resetInactivityTimer]);

  // Clear typing indicators and inactivity timers when chat ends or is denied
  useEffect(() => {
    if (chatEnded || denied) {
      console.log(`🧹 [${role}] Clearing typing indicators and inactivity timers - chat ${chatEnded ? 'ended' : 'denied'}`);
      setTypingFrom(null);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Only clear inactivity timers if NOT auto-ending
      if (!isAutoEndingRef.current) {
        console.log(`🧹 [${role}] Clearing inactivity timers (not auto-ending)`);
        if (inactivityTimerRef.current) {
          console.log(`🧹 [${role}] Clearing auto-end timer (not auto-ending)`);
          clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
        if (warningTimerRef.current) {
          console.log(`🧹 [${role}] Clearing warning timer (not auto-ending)`);
          clearTimeout(warningTimerRef.current);
          warningTimerRef.current = null;
        }
        // Clear all warning timeouts
        warningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        warningTimeoutsRef.current = [];

        // Reset inactivity state
        setInactivityMinutes(0);
        setShowInactivityWarning(false);

        console.log(`✅ [${role}] All timers cleared - inactivity system stopped (${warningTimeoutsRef.current.length} warning timeouts cleared)`);
      } else {
        console.log(`⏳ [${role}] Auto-ending in progress - preserving ALL timers until completion`);
        // Don't clear ANY timers during auto-end - let the auto-end timer complete naturally
        // The auto-end timer will set chatEnded=true and then we can clean up
      }
    }
  }, [chatEnded, denied, role]);

  // Separate cleanup for auto-end completion
  useEffect(() => {
    if (chatEnded && isAutoEndingRef.current) {
      console.log(`🎯 [${role}] Auto-end completed - cleaning up timers`);
      // Auto-end has completed, now we can safely clean up
      const cleanupTimer = setTimeout(() => {
        console.log(`🧹 [${role}] Delayed cleanup after auto-end - clearing all timers`);
        if (inactivityTimerRef.current) {
          console.log(`🧹 [${role}] Clearing auto-end timer after auto-end completion`);
          clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
        if (warningTimerRef.current) {
          console.log(`🧹 [${role}] Clearing warning timer after auto-end completion`);
          clearTimeout(warningTimerRef.current);
          warningTimerRef.current = null;
        }
        warningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        warningTimeoutsRef.current = [];

        // Reset inactivity state
        setInactivityMinutes(0);
        setShowInactivityWarning(false);

        // Reset the auto-ending flag
        isAutoEndingRef.current = false;

        console.log(`✅ [${role}] Auto-end cleanup completed - all timers cleared`);
      }, 1000); // 1 second delay to ensure everything is settled

      return () => clearTimeout(cleanupTimer);
    }
  }, [chatEnded, role]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      // Clear all warning timeouts
      warningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      warningTimeoutsRef.current = [];
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Functions for chat operations
  const request = useCallback(async (user: { id: string; name: string }) => {
    try {
      console.log(`Checking for existing chat request for room ${roomId}`);
      
      // First check if there's already an existing room for this patient
      const existingRoom = await getChatRoom(roomId);
      
      if (existingRoom) {
        console.log(`Found existing room with status: ${existingRoom.status}`);
        
        switch (existingRoom.status) {
          case "pending":
            console.log(`Room ${roomId} already pending - reusing existing request`);
            setPending(true);
            return;
            
          case "active":
            console.log(`Room ${roomId} already active - setting as approved`);
            setApproved(true);
            setPending(false);
            return;
            
          case "denied":
            console.log(`Room ${roomId} was denied - patient should see denial until refresh`);
            setDenied(true);
            return;
            
          case "ended":
            console.log(`Room ${roomId} was ended - creating fresh request`);
            break; // Continue to create new request
        }
      }
      
      // No existing room or room was ended - create new request
      console.log(`Creating new chat request for room ${roomId}`);
      await createChatRoom({
        roomId: roomId,
        patientId: user.id,
        patientName: user.name
      });
      setPending(true);
      console.log(`Chat request created successfully`);
    } catch (error) {
      console.error("Error creating chat request:", error);
    }
  }, [roomId]);

  const sendMessage = useCallback(async (text: string) => {
    try {
      // Add to local state immediately for instant UI feedback
      const newMessage = {
        text,
        from: role,
        ts: Date.now()
      };
      setMessages(prev => [...prev, newMessage]);

      // 🔧 RESET INACTIVITY TIMER on message send (only if chat is still active)
      if (role === "patient" && approved && !chatEnded && !denied) {
        resetInactivityTimer();
      }

      // Save to database
      await sendChatMessage({
        roomId: roomId,
        messageText: text,
        senderRole: role,
        senderName: role === "admin" ? "Admin" : "Patient"
      });

      console.log(`Message sent to database for room ${roomId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove from UI if database save failed
      const messageTs = Date.now();
      setMessages(prev => prev.filter(msg =>
        !(msg.text === text && msg.from === role && Math.abs(msg.ts - messageTs) < 1000)
      ));
    }
  }, [roomId, role, resetInactivityTimer, approved, chatEnded, denied]);

  const sendTyping = useCallback(async (isTyping: boolean) => {
    try {
      // Update presence with typing status
      await updateUserPresence({
        userId: roomId,
        role: role,
        isOnline: true,
        currentRoomId: roomId,
        isTyping: isTyping
      });
      console.log(`${role} typing: ${isTyping}`);
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  }, [role, roomId]);

  const end = useCallback(async () => {
    try {
      console.log(`🔚 [${role}] Ending chat session for room ${roomId} by ${role}`);
      await endChatSession(roomId); // Remove endedBy parameter since it's not in Appwrite schema
      setChatEnded(true);
      setEndedBy(role); // Set who ended the chat (for local state only)
      console.log(`✅ [${role}] Chat session ended successfully for room ${roomId}`);
    } catch (error) {
      console.error(`❌ [${role}] Error ending chat:`, error);
      // Reset auto-ending flag on error
      isAutoEndingRef.current = false;
    }
  }, [roomId, role]);

  const clearUnread = useCallback(async () => {
    try {
      await markMessagesAsRead(roomId, role);
      setUnread(0);
      console.log(`Marked messages as read for room ${roomId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [roomId, role]);

 const refresh = useCallback(async (user?: { id: string; name: string }) => {
    console.log(`🔄 Fast refresh for room ${roomId}`);
    setRefreshing(true);
    
    // INSTANT UI reset - no await
    setApproved(false);
    setPending(false);
    setChatEnded(false);
    setDenied(false);
    setMessages([]);
    setUnread(0);

    // Background cleanup - don't wait for it
    cleanupIfNeeded();
     // 🔧 FIX: Auto-create new chat request for patients
  if (role === "patient" && user) {
    try {
      console.log(`🔄 Auto-creating new chat request for patient ${roomId}`);
      // You'll need to pass user data to the refresh function
      // For now, create a basic user object
      await request(user);
    } catch (error) {
      console.error("Error auto-creating chat request:", error);
    }
  }


    // Show refreshing for just a moment for user feedback
    setTimeout(() => {
      setRefreshing(false);
      console.log(`✅ Chat refreshed instantly - ready for new conversation`);
    }, 300);
  }, [roomId, role]);

  // Separate cleanup function that runs in background
  const cleanupIfNeeded = useCallback(async () => {
    try {
      // Check room status in background
      const room = await getChatRoom(roomId);
      if (room && (room.status === "denied" || room.status === "ended")) {
        console.log(`🧹 Background cleanup: Chat ${roomId} was ${room.status}`);
        await cleanupChatRoom(roomId);
      }
      
      // Update presence in background
      await updateUserPresence({
        userId: roomId,
        role: role,
        isOnline: true,
        currentRoomId: roomId
      });
    } catch (error) {
      console.error("Background cleanup error:", error);
      // Don't throw - this is background operation
    }
  }, [roomId, role]);

  // Cleanup presence on unmount
  useEffect(() => {
    return () => {
      updateUserPresence({
        userId: roomId,
        role: role,
        isOnline: false
      });
    };
  }, [roomId, role]);

  return {
    adminOnline,
    approved,
    pending,
    chatEnded,
    denied,
    messages,
    typingFrom,
    unread,
    refreshing,
    inactivityMinutes,
    showInactivityWarning,
    resetInactivityTimer,
    endedBy,
    request,
    sendMessage,
    sendTyping,
    end,
    clearUnread,
    refresh

  };
}
