import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: { body: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Fix: Provide the missing 'deleted' and 'reactions' fields
    const messageId = await ctx.db.insert("messages", {
      body: args.body,
      conversationId: args.conversationId,
      senderId: user._id,
      deleted: false,       // Default value
      reactions: [],        // Default value
    });

    // Update conversation to show this as the latest message
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
    });

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Check if the person deleting it is the sender
    if (message.senderId !== user._id) {
      throw new Error("You can only delete your own messages");
    }

    // "Soft Delete": Keep the record, but mark it deleted
    await ctx.db.patch(args.messageId, {
      deleted: true,
      body: "This message was deleted",
    });
  },
});

export const getUnreadCount = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return 0;

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) => q.eq("conversationId", args.conversationId).eq("userId", user._id))
      .unique();

    if (!member) return 0;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gt(q.field("_creationTime"), member.lastReadTime))
      .filter((q) => q.neq(q.field("senderId"), user._id))
      .collect();

    return messages.length;
  },
});

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    // Attach sender details to each message
    return await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          senderName: sender?.name || "Unknown User",
          senderImage: sender?.image,
        };
      })
    );
  },
});