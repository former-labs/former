import { clerkClient } from "@clerk/nextjs/server";

// Initialize the Clerk client once
export const clerk = await clerkClient(); 