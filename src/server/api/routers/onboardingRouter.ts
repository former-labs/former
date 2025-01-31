import { createClient } from "@/lib/supabase/server";
import { createTRPCRouter, userProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { databaseMetadataTable, roleTable, RoleType, workspaceTable } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const onboardingRouter = createTRPCRouter({
  createWorkspace: userProtectedProcedure
    .input(
      z.object({
        workspaceName: z.string().min(3, "Workspace name must be at least 3 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Start a transaction for all our database operations
        const result = await db.transaction(async (tx) => {

          // 1. Create workspace
          const [newWorkspace] = await tx
            .insert(workspaceTable)
            .values({
              name: input.workspaceName,
            })
            .returning();

          if (!newWorkspace) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create workspace'
            });
          }

          // 2. Create role
          const [newRole] = await tx
            .insert(roleTable)
            .values({
              workspaceId: newWorkspace.id,
              userId: ctx.user.id,
              roleType: RoleType.OWNER,
            })
            .returning({
              id: roleTable.id,
            });

          if (!newRole) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create role'
            });
          }

          // Create the Supabase client and update auth metadata
          const supabase = await createClient();
          await supabase.auth.updateUser({
            data: { onboarding_complete: true }
          });

          const newRoleWithRelations = await tx.query.roleTable.findFirst({
            where: (role, { eq }) => eq(role.id, newRole.id),
            with: {
              workspace: true,
              user: true,
            },
          });

          // Initialize demo database metadata
          const [databaseMetadata] = await tx
            .insert(databaseMetadataTable)
            .values({
              workspaceId: newWorkspace.id,
              databaseMetadata: DEMO_DATABASE_METADATA
            })
            .returning();

          if (!databaseMetadata) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create database metadata'
            });
          }

          // 3. Return the workspace UID and user ID
          return {
            role: newRoleWithRelations,
          };
        });

        return result;
      } catch (error) {
        console.error('Onboarding error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to complete onboarding',
          cause: error,
        });
      }
    }),
});

const DEMO_DATABASE_METADATA = {
  dialect: "bigquery" as const,
  projects: [
    {
      id: "former-demo",
      name: "former-demo",
      datasets: [
        {
          id: "demo_thelook_ecommerce",
          name: "demo_thelook_ecommerce",
          tables: [
            {
              id: "distribution_centers",
              name: "distribution_centers",
              fields: [
                { name: "id", type: "INT64", description: null },
                { name: "name", type: "STRING", description: null },
                { name: "latitude", type: "FLOAT64", description: null },
                { name: "longitude", type: "FLOAT64", description: null }
              ],
              description: null,
              includedInAIContext: true
            },
            {
              id: "events",
              name: "events",
              fields: [
                { name: "id", type: "INT64", description: null },
                { name: "user_id", type: "INT64", description: null },
                { name: "sequence_number", type: "INT64", description: null },
                { name: "session_id", type: "STRING", description: null },
                { name: "created_at", type: "TIMESTAMP", description: null },
                { name: "ip_address", type: "STRING", description: null },
                { name: "city", type: "STRING", description: null },
                { name: "state", type: "STRING", description: null },
                { name: "postal_code", type: "STRING", description: null },
                { name: "browser", type: "STRING", description: null },
                { name: "traffic_source", type: "STRING", description: null },
                { name: "uri", type: "STRING", description: null },
                { name: "event_type", type: "STRING", description: null }
              ],
              description: null,
              includedInAIContext: true
            },
            {
              id: "inventory_items",
              name: "inventory_items",
              fields: [
                { name: "id", type: "INT64", description: null },
                { name: "product_id", type: "INT64", description: null },
                { name: "created_at", type: "TIMESTAMP", description: null },
                { name: "sold_at", type: "TIMESTAMP", description: null },
                { name: "cost", type: "FLOAT64", description: null },
                { name: "product_category", type: "STRING", description: null },
                { name: "product_name", type: "STRING", description: null },
                { name: "product_brand", type: "STRING", description: null },
                { name: "product_retail_price", type: "FLOAT64", description: null },
                { name: "product_department", type: "STRING", description: null },
                { name: "product_sku", type: "STRING", description: null },
                { name: "product_distribution_center_id", type: "INT64", description: null }
              ],
              description: null,
              includedInAIContext: true
            },
            {
              id: "order_items",
              name: "order_items",
              fields: [
                { name: "id", type: "INT64", description: null },
                { name: "order_id", type: "INT64", description: null },
                { name: "user_id", type: "INT64", description: null },
                { name: "product_id", type: "INT64", description: null },
                { name: "inventory_item_id", type: "INT64", description: null },
                { name: "status", type: "STRING", description: null },
                { name: "created_at", type: "TIMESTAMP", description: null },
                { name: "shipped_at", type: "TIMESTAMP", description: null },
                { name: "delivered_at", type: "TIMESTAMP", description: null },
                { name: "returned_at", type: "TIMESTAMP", description: null },
                { name: "sale_price", type: "FLOAT64", description: null }
              ],
              description: null,
              includedInAIContext: true
            },
            {
              id: "orders",
              name: "orders",
              fields: [
                { name: "order_id", type: "INT64", description: null },
                { name: "user_id", type: "INT64", description: null },
                { name: "status", type: "STRING", description: null },
                { name: "gender", type: "STRING", description: null },
                { name: "created_at", type: "TIMESTAMP", description: null },
                { name: "returned_at", type: "TIMESTAMP", description: null },
                { name: "shipped_at", type: "TIMESTAMP", description: null },
                { name: "delivered_at", type: "TIMESTAMP", description: null },
                { name: "num_of_item", type: "INT64", description: null }
              ],
              description: null,
              includedInAIContext: true
            },
            {
              id: "products",
              name: "products",
              fields: [
                { name: "id", type: "INT64", description: null },
                { name: "cost", type: "FLOAT64", description: null },
                { name: "category", type: "STRING", description: null },
                { name: "name", type: "STRING", description: null },
                { name: "brand", type: "STRING", description: null },
                { name: "retail_price", type: "FLOAT64", description: null },
                { name: "department", type: "STRING", description: null },
                { name: "sku", type: "STRING", description: null },
                { name: "distribution_center_id", type: "INT64", description: null }
              ],
              description: null,
              includedInAIContext: true
            },
            {
              id: "users",
              name: "users",
              fields: [
                { name: "id", type: "INT64", description: null },
                { name: "first_name", type: "STRING", description: null },
                { name: "last_name", type: "STRING", description: null },
                { name: "email", type: "STRING", description: null },
                { name: "age", type: "INT64", description: null },
                { name: "gender", type: "STRING", description: null },
                { name: "state", type: "STRING", description: null },
                { name: "street_address", type: "STRING", description: null },
                { name: "postal_code", type: "STRING", description: null },
                { name: "city", type: "STRING", description: null },
                { name: "country", type: "STRING", description: null },
                { name: "latitude", type: "FLOAT64", description: null },
                { name: "longitude", type: "FLOAT64", description: null },
                { name: "traffic_source", type: "STRING", description: null },
                { name: "created_at", type: "TIMESTAMP", description: null }
              ],
              description: null,
              includedInAIContext: true
            }
          ],
          tableCount: 7,
          description: null
        }
      ],
      description: null
    }
  ]
};
