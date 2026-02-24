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