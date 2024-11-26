import { env } from '@/env'
import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { clerk } from '@/server/utils/clerk'
import type { UserJSON, WebhookEvent } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'

export async function POST(req: Request) {

  // Create new Svix instance with secret
  const wh = new Webhook(env.CLERK_SIGNING_SECRET)

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  let evt: WebhookEvent

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  // Do something with payload
  // For this guide, log payload to console
  const data = evt.data
  
  console.log(`Received webhook with ID ${data.id} and event type of ${evt.type}`)

  switch (evt.type) {
    case 'user.created':
      const authUser = data as UserJSON

      // Create user
      await db.insert(userTable).values({
        clerkAuthId: authUser.id,
        firstName: authUser.first_name ?? '',
        lastName: authUser.last_name ?? '',
        email: authUser.email_addresses[0]?.email_address ?? '',
      }).returning();

      // Set public metadata to indicate not onboarded yet
      await clerk.users.updateUserMetadata(authUser.id, {
        publicMetadata: {
          onboardingComplete: false
        }
      });
      
      break;
      
    default:
      console.log(`Unhandled event type: ${evt.type}`)
      return new Response('Unhandled event type', { status: 200 })
  }

  return new Response('Webhook received and processed', { status: 200 })
}