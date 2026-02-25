import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// This is called when a user first logs in
export const getMe = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

// Add this to your users.ts
export const updatePresence = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (user) {
      // Date.now() provides the current timestamp
      await ctx.db.patch(user._id, { lastSeen: Date.now() });
    }
  },
});

export const storeUser = mutation({
  args: {},
  handler: async (ctx:any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q:any) => q.eq("clerkId", identity.subject))
      .unique();

    if (user !== null) {
      // Update existing user presence
      await ctx.db.patch(user._id, { lastSeen: Date.now() });
      return user._id;
    }

    // Create new user record
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      email: identity.email ?? "",
      image: identity.pictureUrl ?? "",
      clerkId: identity.subject,
      lastSeen: Date.now(),
    });
  },
});

export const getUsers = query({
  handler: async (ctx:any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    // Return all users except the current one
    return await ctx.db
      .query("users")
      .filter((q:any) => q.neq(q.field("clerkId"), identity.subject))
      .collect();
  },
});