import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const setTyping = mutation({
  args: { conversationId: v.id("conversations"), isTyping: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return;

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (member) {
      await ctx.db.patch(member._id, { 
        typingUntil: args.isTyping ? Date.now() + 3000 : 0 
      });
    }
  },
});

// Query to see who is typing in a conversation
export const getTypingIndicators = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const typers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gt(q.field("typingUntil"), Date.now()))
      .filter((q) => q.neq(q.field("userId"), currentUser?._id))
      .collect();

    // Fetch the names of typers
    const names = await Promise.all(
      typers.map(async (t) => {
        const user = await ctx.db.get(t.userId);
        return user?.name;
      })
    );

    return names.filter(Boolean);
  },
});

export const markAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return;

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) => q.eq("conversationId", args.conversationId).eq("userId", user._id))
      .unique();

    if (member) {
      await ctx.db.patch(member._id, { lastReadTime: Date.now() });
    }
  },
});

export const createOrGetConversation = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // 1. Check if a conversation already exists between these two
    const existingMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const member of existingMembership) {
      const otherMember = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", member.conversationId))
        .filter((q) => q.eq(q.field("userId"), args.otherUserId))
        .unique();

      if (otherMember) {
        return member.conversationId; // Return existing ID
      }
    }

    // 2. If no conversation exists, create a new one
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: false,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: user._id,
      lastReadTime: Date.now(),
      typingUntil: 0,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.otherUserId,
      lastReadTime: Date.now(),
      typingUntil: 0,
    });

    return conversationId;
  },
});

export const createGroup = mutation({
  args: { 
    name: v.string(), 
    userIds: v.array(v.id("users")) 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // 1. Create the conversation record
    const conversationId = await ctx.db.insert("conversations", {
      name: args.name,
      isGroup: true,
    });

    // 2. Add all selected users + the creator
    const allMembers = [...new Set([...args.userIds, user._id])];
    
    for (const userId of allMembers) {
      await ctx.db.insert("conversationMembers", {
        conversationId,
        userId,
        lastReadTime: Date.now(),
        typingUntil: 0,
      });
    }

    return conversationId;
  },
});

export const getConversationWithUser = query({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const m of member) {
      const other = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", m.conversationId))
        .filter((q) => q.eq(q.field("userId"), args.otherUserId))
        .unique();
      if (other) return m.conversationId;
    }
    return null;
  },
});

export const getMyConversations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const conversations = await Promise.all(
      memberships.map(async (m) => {
        const convo = await ctx.db.get(m.conversationId);
        if (!convo) return null;

        // --- Get basic message info ---
        const lastMessage = convo.lastMessageId 
          ? await ctx.db.get(convo.lastMessageId) 
          : null;

        const unreads = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) => q.eq("conversationId", convo._id))
          .filter((q) => q.gt(q.field("_creationTime"), m.lastReadTime || 0))
          .filter((q) => q.neq(q.field("senderId"), user._id))
          .collect();

        // --- THE ONLINE STATUS LOGIC ---
        let name = convo.name;
        let image = ""; 
        let lastSeen = 0; // Default to 0 (offline)

        if (!convo.isGroup) {
          // Find the other person in this chat
          const otherMember = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", convo._id))
            .filter((q) => q.neq(q.field("userId"), user._id))
            .unique();
            
          const otherUser = otherMember ? await ctx.db.get(otherMember.userId) : null;
          
          name = otherUser?.name;
          image = otherUser?.image ?? "";
          // THIS LINE PASSES THE DATA TO YOUR SIDEBAR
          lastSeen = otherUser?.lastSeen ?? 0; 
        }

        return {
          ...convo,
          name,
          image,
          lastSeen, // Now convo.lastSeen will exist in your frontend!
          lastMessage: lastMessage?.body,
          lastMessageTime: lastMessage?._creationTime,
          unreadCount: unreads.length,
        };
      })
    );

    return conversations
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));
  },
});

export const getConversationWithDetails = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const convo = await ctx.db.get(args.conversationId);
    if (!convo) return null;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (convo.isGroup) {
      return { ...convo, isOnline: false }; // Groups themselves don't have "online" status
    }

    // For 1-on-1, fetch the other user's profile and check presence
    const otherMember = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.neq(q.field("userId"), currentUser?._id))
      .unique();

    const otherUser = otherMember ? await ctx.db.get(otherMember.userId) : null;
    
    // Calculate online status: true if lastSeen was within the last 60 seconds
    const isOnline = otherUser?.lastSeen 
      ? Date.now() - otherUser.lastSeen < 60000 
      : false;

    return {
      ...convo,
      name: otherUser?.name,
      image: otherUser?.image,
      isOnline: isOnline, // This property will now exist for TypeScript
    };
  },
});

export const getConversationMembers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const userDetails = await Promise.all(
      members.map(async (m) => {
        return await ctx.db.get(m.userId);
      })
    );

    return userDetails.filter(Boolean);
  },
});