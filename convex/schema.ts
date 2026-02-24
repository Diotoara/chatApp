import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.string(),
    clerkId: v.string(),
    lastSeen: v.number(), // For Online Status
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    isGroup: v.boolean(),
    name: v.optional(v.string()), // Only for groups
    lastMessageId: v.optional(v.id("messages")),
  }),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastReadTime: v.number(), // For Unread Message Count
    typingUntil: v.number(),  // For Typing Indicator
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_userId", ["userId"])
    .index("by_conversation_and_user", ["conversationId", "userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
    deleted: v.boolean(),     // For Soft Delete
    reactions: v.array(       // For Message Reactions
      v.object({
        emoji: v.string(),
        userId: v.id("users"),
      })
    ),
  }).index("by_conversationId", ["conversationId"]),
});