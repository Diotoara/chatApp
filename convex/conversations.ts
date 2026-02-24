import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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