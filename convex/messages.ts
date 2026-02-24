import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: { 
    body: v.string(), 
    conversationId: v.id("conversations") 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const messageId = await ctx.db.insert("messages", {
      body: args.body,
      conversationId: args.conversationId,
      senderId: user._id,
      deleted: false,
      reactions: [],
    });

    // Update the conversation with the last message ID
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
    });

    return messageId;
  },
});

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});