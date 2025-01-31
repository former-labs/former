import { createClient } from "@/lib/supabase/server";
import { createTRPCRouter, userProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { databaseMetadataTable, knowledgeTable, roleTable, RoleType, workspaceTable } from "@/server/db/schema";
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

          // Initialize demo queries
          const demoQueries = await tx.insert(knowledgeTable).values(
            DEMO_QUERIES.map(query => ({
              workspaceId: newWorkspace.id,
              name: query.name,
              description: query.description,
              query: query.query
            }))
          ).returning();

          if (!demoQueries || demoQueries.length === 0) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create demo queries'
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
          id: "thelook_ecommerce",
          name: "thelook_ecommerce",
          tables: [
            {
              id: "distribution_centers",
              name: "distribution_centers", 
              description: "Contains information about product distribution centers",
              fields: [
                { name: "id", type: "INT64", description: "Unique identifier for each distribution center e.g. 1" },
                { name: "name", type: "STRING", description: "Name of the distribution center e.g. Chicago IL" },
                { name: "latitude", type: "FLOAT64", description: "Latitude coordinate of the distribution center location e.g. 41.8781" },
                { name: "longitude", type: "FLOAT64", description: "Longitude coordinate of the distribution center location e.g. -87.6298" }
              ],
              includedInAIContext: true
            },
            {
              id: "events",
              name: "events",
              description: "Tracks user events and interactions on the e-commerce platform",
              fields: [
                { name: "id", type: "INT64", description: "Unique identifier for each event e.g. 1001" },
                { name: "user_id", type: "INT64", description: "ID of the user who triggered the event e.g. 5432" },
                { name: "sequence_number", type: "INT64", description: "Order of events within a session e.g. 3" },
                { name: "session_id", type: "STRING", description: "Unique identifier for user session e.g. abc123xyz" },
                { name: "created_at", type: "TIMESTAMP", description: "When the event occurred e.g. 2023-01-15 14:30:00" },
                { name: "ip_address", type: "STRING", description: "IP address of the user e.g. 192.168.1.1" },
                { name: "city", type: "STRING", description: "City of the user e.g. New York" },
                { name: "state", type: "STRING", description: "State of the user e.g. NY" },
                { name: "postal_code", type: "STRING", description: "Postal code of the user e.g. 10001" },
                { name: "browser", type: "STRING", description: "Web browser used e.g. Chrome" },
                { name: "traffic_source", type: "STRING", description: "Source of the traffic e.g. Google" },
                { name: "uri", type: "STRING", description: "Page URL where event occurred e.g. /products/123" },
                { name: "event_type", type: "STRING", description: "Type of event e.g. page_view" }
              ],
              includedInAIContext: true
            },
            {
              id: "inventory_items",
              name: "inventory_items",
              description: "Tracks individual inventory items and their details",
              fields: [
                { name: "id", type: "INT64", description: "Unique identifier for inventory item e.g. 5001" },
                { name: "product_id", type: "INT64", description: "ID of the associated product e.g. 123" },
                { name: "created_at", type: "TIMESTAMP", description: "When item was added to inventory e.g. 2023-01-01 09:00:00" },
                { name: "sold_at", type: "TIMESTAMP", description: "When item was sold e.g. 2023-01-15 13:45:00" },
                { name: "cost", type: "FLOAT64", description: "Cost price of the item e.g. 25.50" },
                { name: "product_category", type: "STRING", description: "Category of the product e.g. Electronics" },
                { name: "product_name", type: "STRING", description: "Name of the product e.g. Wireless Headphones" },
                { name: "product_brand", type: "STRING", description: "Brand of the product e.g. Sony" },
                { name: "product_retail_price", type: "FLOAT64", description: "Retail price of the product e.g. 49.99" },
                { name: "product_department", type: "STRING", description: "Department the product belongs to e.g. Audio" },
                { name: "product_sku", type: "STRING", description: "Stock keeping unit e.g. SKU123456" },
                { name: "product_distribution_center_id", type: "INT64", description: "ID of distribution center e.g. 2" }
              ],
              includedInAIContext: true
            },
            {
              id: "order_items",
              name: "order_items",
              description: "Details of individual items within orders",
              fields: [
                { name: "id", type: "INT64", description: "Unique identifier for order item e.g. 10001" },
                { name: "order_id", type: "INT64", description: "ID of the parent order e.g. 5001" },
                { name: "user_id", type: "INT64", description: "ID of the purchasing user e.g. 1234" },
                { name: "product_id", type: "INT64", description: "ID of the purchased product e.g. 789" },
                { name: "inventory_item_id", type: "INT64", description: "ID of specific inventory item e.g. 5001" },
                { name: "status", type: "STRING", description: "Current status of the order item e.g. Delivered" },
                { name: "created_at", type: "TIMESTAMP", description: "When order was placed e.g. 2023-02-01 10:30:00" },
                { name: "shipped_at", type: "TIMESTAMP", description: "When item was shipped e.g. 2023-02-02 09:15:00" },
                { name: "delivered_at", type: "TIMESTAMP", description: "When item was delivered e.g. 2023-02-04 14:20:00" },
                { name: "returned_at", type: "TIMESTAMP", description: "When item was returned e.g. 2023-02-10 11:00:00" },
                { name: "sale_price", type: "FLOAT64", description: "Final sale price e.g. 45.99" }
              ],
              includedInAIContext: true
            },
            {
              id: "orders",
              name: "orders",
              description: "Main orders table containing order-level information",
              fields: [
                { name: "order_id", type: "INT64", description: "Unique identifier for order e.g. 5001" },
                { name: "user_id", type: "INT64", description: "ID of ordering user e.g. 1234" },
                { name: "status", type: "STRING", description: "Current order status e.g. Processing" },
                { name: "gender", type: "STRING", description: "Customer's gender e.g. Female" },
                { name: "created_at", type: "TIMESTAMP", description: "When order was created e.g. 2023-03-01 15:30:00" },
                { name: "returned_at", type: "TIMESTAMP", description: "When order was returned e.g. 2023-03-10 09:45:00" },
                { name: "shipped_at", type: "TIMESTAMP", description: "When order was shipped e.g. 2023-03-02 11:20:00" },
                { name: "delivered_at", type: "TIMESTAMP", description: "When order was delivered e.g. 2023-03-04 14:15:00" },
                { name: "num_of_item", type: "INT64", description: "Number of items in order e.g. 3" }
              ],
              includedInAIContext: true
            },
            {
              id: "products",
              name: "products",
              description: "Product catalog with details of all available products",
              fields: [
                { name: "id", type: "INT64", description: "Unique identifier for product e.g. 789" },
                { name: "cost", type: "FLOAT64", description: "Cost price of product e.g. 30.00" },
                { name: "category", type: "STRING", description: "Product category e.g. Electronics" },
                { name: "name", type: "STRING", description: "Product name e.g. Bluetooth Speaker" },
                { name: "brand", type: "STRING", description: "Product brand e.g. JBL" },
                { name: "retail_price", type: "FLOAT64", description: "Retail selling price e.g. 59.99" },
                { name: "department", type: "STRING", description: "Department product belongs to e.g. Audio" },
                { name: "sku", type: "STRING", description: "Stock keeping unit e.g. SKU789012" },
                { name: "distribution_center_id", type: "INT64", description: "ID of stocking distribution center e.g. 2" }
              ],
              includedInAIContext: true
            },
            {
              id: "users",
              name: "users",
              description: "Customer information and demographics",
              fields: [
                { name: "id", type: "INT64", description: "Unique identifier for user e.g. 1234" },
                { name: "first_name", type: "STRING", description: "User's first name e.g. John" },
                { name: "last_name", type: "STRING", description: "User's last name e.g. Smith" },
                { name: "email", type: "STRING", description: "User's email address e.g. john.smith@email.com" },
                { name: "age", type: "INT64", description: "User's age e.g. 35" },
                { name: "gender", type: "STRING", description: "User's gender e.g. Male" },
                { name: "state", type: "STRING", description: "User's state e.g. California" },
                { name: "street_address", type: "STRING", description: "User's street address e.g. 123 Main St" },
                { name: "postal_code", type: "STRING", description: "User's postal code e.g. 94105" },
                { name: "city", type: "STRING", description: "User's city e.g. San Francisco" },
                { name: "country", type: "STRING", description: "User's country e.g. United States" },
                { name: "latitude", type: "FLOAT64", description: "Location latitude e.g. 37.7749" },
                { name: "longitude", type: "FLOAT64", description: "Location longitude e.g. -122.4194" },
                { name: "traffic_source", type: "STRING", description: "How user found the site e.g. Facebook" },
                { name: "created_at", type: "TIMESTAMP", description: "When user account was created e.g. 2023-01-01 00:00:00" }
              ],
              includedInAIContext: true
            }
          ],
          tableCount: 7,
          description: "E-commerce dataset containing orders, products, users, and related data"
        }
      ],
      description: "Demo project containing e-commerce sample data"
    }
  ]
};

const DEMO_QUERIES = [
  {
    name: "Distribution Center Order Volume and Average Delivery Time",
    description: "This query calculates the order volume and average delivery time per distribution center for the past month",
    query: `SELECT
  dc.id AS distribution_center_id,
  dc.name AS distribution_center_name,
  COUNT(DISTINCT oi.order_id) AS total_orders,
  AVG(TIMESTAMP_DIFF(oi.delivered_at, oi.created_at, MINUTE)) AS average_delivery_time_minutes
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
JOIN \`former-demo.thelook_ecommerce.inventory_items\` AS ii ON oi.inventory_item_id = ii.id
JOIN \`former-demo.thelook_ecommerce.distribution_centers\` AS dc ON ii.product_distribution_center_id = dc.id
WHERE DATE(oi.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)
  AND oi.delivered_at IS NOT NULL
GROUP BY distribution_center_id, distribution_center_name
ORDER BY total_orders DESC`
  },
  {
    name: "Delivery Time By Distribution Center Last 6 Weeks",
    description: "Calculates the average delivery time by distribution center for the last 6 weeks.",
    query: `SELECT
  dc.id AS distribution_center_id,
  dc.name AS distribution_center_name,
  COUNT(DISTINCT oi.order_id) AS total_orders,
  AVG(TIMESTAMP_DIFF(oi.delivered_at, oi.created_at, MINUTE)) AS average_delivery_time_minutes
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
JOIN \`former-demo.thelook_ecommerce.inventory_items\` AS ii ON oi.inventory_item_id = ii.id
JOIN \`former-demo.thelook_ecommerce.distribution_centers\` AS dc ON ii.product_distribution_center_id = dc.id
WHERE DATE(oi.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 WEEK)
  AND oi.delivered_at IS NOT NULL
GROUP BY distribution_center_id, distribution_center_name
ORDER BY total_orders DESC`
  },
  {
    name: "Best Marketing Channels",
    description: "Identifies the most effective marketing channels based on the number of unique customers they brought in. It joins the order_items and users tables, excludes cancelled and returned orders, and groups the results by traffic source.",
    query: `SELECT
 u.traffic_source, 
 COUNT(DISTINCT oi.user_id) total_customers
FROM \`former-demo.thelook_ecommerce.order_items\` oi
LEFT JOIN \`former-demo.thelook_ecommerce.users\` u
ON oi.user_id = u.id
WHERE oi.status NOT IN ('Cancelled','Returned')
GROUP BY 1
ORDER BY 2 DESC`
  },
  {
    name: "Execute Count Orders Last Week",
    description: "Calculates the number of distinct orders placed in the last week, excluding cancelled and returned orders.",
    query: `SELECT 
 DATE_TRUNC(DATE(oi.created_at), WEEK(MONDAY)) AS week_start_date,
 COUNT(DISTINCT oi.order_id) AS number_of_orders
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
WHERE oi.status NOT IN ('Cancelled', 'Returned')
 AND DATE(oi.created_at) >= DATE_SUB(
 DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY)),
 INTERVAL 1 WEEK
 )
 AND DATE(oi.created_at) < DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY))
GROUP BY 1
ORDER BY 1 DESC`
  },
  {
    name: "Sales Last 3 Months",
    description: "Sales in the last 3 months",
    query: `SELECT 
  DATE_TRUNC(DATE(oi.created_at), MONTH) AS month,
  SUM(oi.sale_price) AS order_revenue,
  COUNT(DISTINCT oi.order_id) AS order_count,
  COUNT(DISTINCT oi.user_id) AS customer_count
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
LEFT JOIN \`former-demo.thelook_ecommerce.orders\` AS o ON oi.order_id = o.order_id
WHERE oi.status NOT IN ('Cancelled', 'Returned') 
AND DATE(oi.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)
GROUP BY 1
ORDER BY 1 DESC`
  },
  {
    name: "User Counts for New Zealand and Australia",
    description: "Counts distinct users from the \"users\" table who are from either New Zealand or Australia, grouping the count by each country and ordering them by the user count in descending order.",
    query: `-- Count distinct users from New Zealand and Australia
SELECT 
  country, -- Select country
  COUNT(DISTINCT id) AS user_count -- Count distinct users by their ID
FROM \`former-demo.thelook_ecommerce.users\` -- From the users table
WHERE country IN ('New Zealand', 'Australia') -- Filter for New Zealand and Australia
GROUP BY country -- Group results by country
ORDER BY user_count DESC; -- Order by number of users in descending order`
  },
  {
    name: "Brand Sales",
    description: "Calculates the revenue and quantity sold per brand. It joins the order_items, orders, and products tables and excludes cancelled and returned orders. The results are grouped by brand",
    query: `SELECT
 p.brand,
 SUM(oi.sale_price) AS revenue,
 COUNT(oi.id) AS quantity
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
 LEFT JOIN \`former-demo.thelook_ecommerce.products\` AS p ON oi.product_id = p.id
WHERE oi.status NOT IN ('Cancelled','Returned')
GROUP BY 1
ORDER BY 3 DESC`
  },
  {
    name: "Revenue Generated per Product for Q1",
    description: "This query calculates the revenue generated by each product in the first quarter of the current year. It joins the `order_items` and `products` tables while excluding cancelled and returned orders and filters the date range to include only the first quarter (January to March). The results are grouped by product.",
    query: `SELECT 
  p.id AS product_id,
  p.name AS product_name,
  SUM(oi.sale_price) AS revenue
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
LEFT JOIN \`former-demo.thelook_ecommerce.products\` AS p ON oi.product_id = p.id
WHERE oi.status NOT IN ('Cancelled','Returned')
  AND EXTRACT(MONTH FROM DATE(oi.created_at)) BETWEEN 1 AND 3
  AND EXTRACT(YEAR FROM DATE(oi.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE())
GROUP BY 1, 2
ORDER BY 3 DESC`
  },
  {
    name: "Top Products by Return Rate",
    description: "Calculates the return rate for each product based on the number of returned items over the number of items sold and list the top 5 products with the highest return rate considering only products with more than 2 sales over the last year.",
    query: `SELECT 
  oi.product_id as product_id, 
  p.name as product_name, 
  p.category as product_category, 
  COUNT(oi.id) as num_of_items_sold,
  SUM(CASE WHEN oi.status = 'Returned' THEN 1 ELSE 0 END) as num_returned,
  SUM(CASE WHEN oi.status = 'Returned' THEN 1 ELSE 0 END) / COUNT(oi.id) as return_rate
FROM \`former-demo.thelook_ecommerce.order_items\` as oi 
JOIN \`former-demo.thelook_ecommerce.products\` as p 
ON oi.product_id = p.id
WHERE EXTRACT(YEAR FROM DATE(oi.created_at)) = EXTRACT(YEAR FROM DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR))
GROUP BY 1,2,3
HAVING num_of_items_sold > 2
ORDER BY return_rate DESC
LIMIT 5;`
  },
  {
    name: "Count Orders Last Week",
    description: "This query retrieves the count of orders placed in the last week based on the `created_at` timestamp.",
    query: `SELECT 
  DATE_TRUNC(DATE(oi.created_at), WEEK(MONDAY)) AS week_start_date,
  COUNT(DISTINCT oi.order_id) AS number_of_orders
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
WHERE oi.status NOT IN ('Cancelled', 'Returned')
AND DATE(oi.created_at) >= DATE_SUB(
  DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY)),
  INTERVAL 1 WEEK
)
AND DATE(oi.created_at) < DATE_TRUNC(CURRENT_DATE(), WEEK(MONDAY))
GROUP BY 1
ORDER BY 1 DESC`
  },
  {
    name: "Average Profit and SKU Sold Per Event",
    description: "Calculates the average profit and average number of SKU sold per event for male customers from California who were sourced from social media and attended between 2 and 5 events in the year 2023. The calculation of profit assumes that `cost` and `profit` information is available in the dataset.",
    query: `SELECT
  e.id AS event_id,
  AVG(oi.sale_price - ii.cost) AS avg_profit,
  AVG(
    (
      SELECT COUNT(oitemp.id) 
      FROM \`former-demo.thelook_ecommerce.order_items\` AS oitemp 
      WHERE oitemp.order_id = o.order_id
    )
  ) AS avg_sku_sold
FROM \`former-demo.thelook_ecommerce.events\` AS e
JOIN \`former-demo.thelook_ecommerce.users\` AS u 
  ON e.user_id = u.id
JOIN \`former-demo.thelook_ecommerce.orders\` AS o 
  ON u.id = o.user_id
JOIN \`former-demo.thelook_ecommerce.order_items\` AS oi 
  ON o.order_id = oi.order_id
JOIN \`former-demo.thelook_ecommerce.inventory_items\` AS ii 
  ON oi.inventory_item_id = ii.id
WHERE u.traffic_source = 'Facebook'
  AND u.gender = 'M'
  AND u.state = 'California'
  AND e.created_at BETWEEN '2023-01-01' AND '2023-12-31'
GROUP BY e.id
HAVING COUNT(DISTINCT e.event_type) BETWEEN 2 AND 5`
  },
  {
    name: "Best Selling Items",
    description: "Identifies the best-selling items based on the number of orders. It joins the products and order_items tables and groups the results by product ID, name, and category, ordering them by the number of orders in descending order.",
    query: `SELECT oi.product_id as product_id, 
p.name as product_name, p.category as product_category, count(oi.id) as num_of_items_sold
FROM \`former-demo.thelook_ecommerce.products\` as p 
JOIN \`former-demo.thelook_ecommerce.order_items\` as oi
ON p.id = oi.product_id
GROUP BY 1,2,3
ORDER BY num_of_items_sold DESC`
  },
  {
    name: "Avg Order Value By Power Users vs Infrequent Users",
    description: "Calculates the average order value for users who have placed more than 5 orders versus users who have placed 5 or fewer orders. The query will join the `order_items`, `users`, and `orders` tables and utilize CASE statements to differentiate between the two groups of users.",
    query: `WITH UserOrderCounts AS (
  SELECT 
    u.id AS user_id, 
    COUNT(DISTINCT o.order_id) AS order_count
  FROM \`former-demo.thelook_ecommerce.orders\` AS o
  JOIN \`former-demo.thelook_ecommerce.users\` AS u 
    ON u.id = o.user_id
  GROUP BY u.id
), 
UserOrderValues AS (
  SELECT 
    oi.user_id, 
    oi.order_id, 
    SUM(oi.sale_price) AS order_value
  FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
  GROUP BY oi.user_id, oi.order_id
)
SELECT
  CASE
    WHEN uoc.order_count > 5 THEN '>5 Orders'
    ELSE '5 Orders or less'
  END AS user_group,
  AVG(uov.order_value) AS average_order_value
FROM UserOrderValues AS uov
JOIN UserOrderCounts AS uoc 
  ON uoc.user_id = uov.user_id
GROUP BY user_group`
  },
  {
    name: "Monthly Sales",
    description: "Calculates monthly revenue, order count, and the number of unique customers who made purchases, excluding cancelled and returned orders. It joins the order_items and orders tables and groups the results by month.",
    query: `SELECT 
    DATE_TRUNC(DATE(oi.created_at),MONTH) AS month,
    SUM(oi.sale_price) AS revenue,
    COUNT(DISTINCT oi.order_id) AS order_count,
    COUNT(DISTINCT oi.user_id) AS customers_purchased
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
LEFT JOIN \`former-demo.thelook_ecommerce.orders\` AS o 
ON oi.order_id = o.order_id
WHERE oi.status NOT IN ('Cancelled','Returned')
GROUP BY 1
ORDER BY 1 DESC`
  },
  {
    name: "Female Customers from China",
    description: "Lists the IDs and emails of female customers from China. It selects from the users table where gender is female and country is China.",
    query: `SELECT 
  id,
  email
FROM \`former-demo.thelook_ecommerce.users\` 
WHERE gender = 'F' AND country = 'China'
ORDER BY 1;`
  },
  {
    name: "Month Over Month Growth Rate In New User Signups",
    description: "Calculates the number of new user sign-ups each month for the last 12 months, as well as the percentage growth rate over the previous month.",
    query: `SELECT
  YEAR_MONTH,
  NEW_USER_SIGNUPS,
  ROUND(((NEW_USER_SIGNUPS - LAG(NEW_USER_SIGNUPS) OVER (ORDER BY YEAR_MONTH)) / LAG(NEW_USER_SIGNUPS) OVER (ORDER BY YEAR_MONTH)) * 100, 2) AS GROWTH_RATE
FROM (
  SELECT
    FORMAT_TIMESTAMP('%Y-%m', created_at) AS YEAR_MONTH,
    COUNT(id) AS NEW_USER_SIGNUPS
  FROM \`former-demo.thelook_ecommerce.users\`
  WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
  GROUP BY YEAR_MONTH
  ORDER BY YEAR_MONTH
)`
  },
  {
    name: "Top 10 Most Popular Countries Last Year",
    description: "Returns the top 10 countries with the highest number of unique users who placed valid orders (not cancelled or returned) in the previous year. Users are distinct per country, and the results are ordered in descending order of user count.",
    query: `WITH valid_orders_last_year AS (
  SELECT DISTINCT
    u.id AS user_id,
    u.country
  FROM
    \`former-demo.thelook_ecommerce.order_items\` AS oi
  JOIN \`former-demo.thelook_ecommerce.users\` AS u ON oi.user_id = u.id
  WHERE
    oi.status NOT IN ('Cancelled', 'Returned')
    AND EXTRACT(YEAR FROM oi.created_at) = EXTRACT(YEAR FROM CURRENT_DATE()) - 1 -- filter for last year
)

SELECT
  country,
  COUNT(DISTINCT user_id) AS unique_users
FROM valid_orders_last_year
GROUP BY country
ORDER BY unique_users DESC
LIMIT 10;  -- limit to top 10 countries`
  },
  {
    name: "Percentage Of Orders By Repeat Customer",
    description: "Calculates the percentage of total orders that are made by customers who have ordered more than once.",
    query: `SELECT
  (COUNT(DISTINCT CASE WHEN customer_order_counts.order_count > 1 THEN o.order_id ELSE NULL END) /
  COUNT(DISTINCT o.order_id)) * 100 AS percentage_repeat_orders
FROM \`former-demo.thelook_ecommerce.orders\` AS o
INNER JOIN (
  SELECT u.id AS user_id, COUNT(o.order_id) AS order_count
  FROM \`former-demo.thelook_ecommerce.users\` AS u
  INNER JOIN \`former-demo.thelook_ecommerce.orders\` AS o ON u.id = o.user_id
  GROUP BY u.id
) AS customer_order_counts ON o.user_id = customer_order_counts.user_id`
  },
  {
    name: "Average Daily Sales Volume Weekdays Vs Weekends",
    description: "This query calculates the average daily sales volume for weekdays and weekends over the last 3 months. It filters the orders based on the status and date, separates weekdays from weekends based on the day of the week, and groups the results to calculate average sales volume for each type of day.",
    query: `SELECT
  CASE 
    WHEN EXTRACT(DAYOFWEEK FROM DATE(oi.created_at)) BETWEEN 2 AND 6 THEN 'Weekday'
    ELSE 'Weekend' 
  END AS day_type,
  DATE(oi.created_at) AS sale_date,
  COUNT(DISTINCT oi.order_id) AS daily_order_count,
  SUM(oi.sale_price) AS daily_sales_vol
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
LEFT JOIN \`former-demo.thelook_ecommerce.orders\` AS o 
  ON oi.order_id = o.order_id
WHERE oi.status NOT IN ('Cancelled', 'Returned')
  AND DATE(oi.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)
GROUP BY day_type, sale_date
ORDER BY sale_date`
  },
  {
    name: "Most Popular Country Last Year",
    description: "Modifies the `Customers by Country` query to filter for customers who placed orders last year and provides a count by country, ordered by the highest customer count.",
    query: `WITH cust AS (
  SELECT 
    DISTINCT oi.user_id,
    u.country AS country
  FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
  INNER JOIN \`former-demo.thelook_ecommerce.users\` AS u 
  ON oi.user_id = u.id
  WHERE oi.status NOT IN ('Cancelled','Returned')
  -- Added filter for orders from last year
  AND EXTRACT(YEAR FROM oi.created_at) = EXTRACT(YEAR FROM CURRENT_DATE()) - 1
  GROUP BY 1, 2
)

SELECT
  c.country,
  COUNT(DISTINCT c.user_id) AS customers_count
FROM cust AS c
GROUP BY 1
ORDER BY 2 DESC
LIMIT 1;`
  },
  {
    name: "Orders With Swim And Socks Categories",
    description: "Retrieves the details of orders that included products in both 'Swim' and 'Socks' categories by joining the products and order_items tables and filtering on orders that contain both categories.",
    query: `SELECT
  o.order_id,
  ARRAY_AGG(DISTINCT p1.category) as categories,
  ARRAY_AGG(DISTINCT p1.name) as product_names,
  ARRAY_AGG(p1.id) as product_ids,
  o.user_id,
  o.created_at
FROM (
  SELECT DISTINCT order_id
  FROM \`former-demo.thelook_ecommerce.order_items\` oi
  JOIN \`former-demo.thelook_ecommerce.products\` p
  ON oi.product_id = p.id
  WHERE p.category = 'Swim'
) swim_orders
JOIN (
  SELECT DISTINCT order_id
  FROM \`former-demo.thelook_ecommerce.order_items\` oi
  JOIN \`former-demo.thelook_ecommerce.products\` p
  ON oi.product_id = p.id
  WHERE p.category = 'Socks'
) socks_orders
ON swim_orders.order_id = socks_orders.order_id
JOIN \`former-demo.thelook_ecommerce.order_items\` o
ON swim_orders.order_id = o.order_id
JOIN \`former-demo.thelook_ecommerce.products\` p1
ON o.product_id = p1.id
GROUP BY 1, 5, 6
ORDER BY o.order_id`
  },
  {
    name: "Customers With Largest Overall Spend",
    description: "Identifies the top 10 customers with the highest total purchase amount. It joins the order_items, users, and orders tables, excludes cancelled and returned orders, and groups the results by user ID and email, ordering them by the total purchase amount in descending order.",
    query: `SELECT 
  oi.user_id,
  u.email,
  SUM(oi.sale_price) total_purchase
FROM \`former-demo.thelook_ecommerce.order_items\` oi
LEFT JOIN \`former-demo.thelook_ecommerce.users\` u ON oi.user_id = u.id
WHERE oi.status NOT IN ('Cancelled','Returned')
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 10;`
  },
  {
    name: "Top 10 Percent Users By Spending And Category Comparison",
    description: "This query will identify the top 10% of users by spending in the last year and compare their spending patterns by product categories with the rest of the population.",
    query: `WITH TotalUserSpend AS (
  SELECT
    oi.user_id,
    SUM(oi.sale_price) AS total_spend
  FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
  WHERE oi.status NOT IN ('Cancelled', 'Returned')
    AND EXTRACT(YEAR FROM DATE(oi.created_at)) = EXTRACT(YEAR FROM DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR))
  GROUP BY oi.user_id
), SpendPercentiles AS (
  SELECT
    user_id,
    total_spend,
    PERCENT_RANK() OVER (ORDER BY total_spend DESC) AS spend_percentile
  FROM TotalUserSpend
), Top10PercentUsers AS (
  SELECT
    user_id,
    total_spend
  FROM SpendPercentiles
  WHERE spend_percentile <= 0.1
), CategorySpendingPatterns AS (
  SELECT
    oi.user_id,
    p.category,
    SUM(oi.sale_price) AS category_spend
  FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
  JOIN \`former-demo.thelook_ecommerce.products\` AS p ON oi.product_id = p.id
  WHERE oi.status NOT IN ('Cancelled', 'Returned')
  GROUP BY oi.user_id, p.category
)
SELECT
  CASE
    WHEN t.user_id IS NOT NULL THEN 'Top 10%'
    ELSE 'Remaining 90%'
  END AS user_group,
  cp.category,
  SUM(cp.category_spend) AS total_category_spend
FROM CategorySpendingPatterns AS cp
LEFT JOIN Top10PercentUsers AS t ON cp.user_id = t.user_id
GROUP BY user_group, cp.category
ORDER BY user_group DESC, total_category_spend DESC`
  },
  {
    name: "Products Sales",
    description: "Calculates the sales revenue and quantity for each product category. It joins the order_items, orders, and products tables and excludes cancelled and returned orders. The results are grouped by product category.",
    query: `SELECT 
 p.category,
 SUM(oi.sale_price) AS revenue,
 COUNT(oi.id) AS quantity
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
LEFT JOIN \`former-demo.thelook_ecommerce.products\` AS p
ON oi.product_id = p.id
WHERE oi.status NOT IN ('Cancelled','Returned')
GROUP BY 1
ORDER BY 3 DESC`
  },
  {
    name: "Top 3 Products By Category Since Last Year",
    description: "Lists the top 3 most frequently purchased products in each product category since the beginning of the last year.",
    query: `WITH RankedProducts AS (
  SELECT
    p.id as product_id,
    p.name as product_name,
    p.category as product_category,
    COUNT(oi.id) as num_of_items_sold,
    RANK() OVER (PARTITION BY p.category ORDER BY COUNT(oi.id) DESC) as rank
  FROM \`former-demo.thelook_ecommerce.products\` as p
  INNER JOIN \`former-demo.thelook_ecommerce.order_items\` as oi
  ON p.id = oi.product_id
  WHERE EXTRACT(YEAR FROM DATE(oi.created_at)) = EXTRACT(YEAR FROM DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR))
  GROUP BY 1, 2, 3
)
SELECT
  product_id,
  product_name,
  product_category,
  num_of_items_sold
FROM RankedProducts
WHERE rank <= 3
ORDER BY product_category, num_of_items_sold DESC -- Ordering by category and number of items sold`
  },
  {
    name: "Customers by Country",
    description: "Provides a count of customers by country, segmented by gender. It joins the order_items and users tables and excludes cancelled and returned orders. The result shows the number of male and female customers in each country.",
    query: `WITH cust AS (
  SELECT 
    DISTINCT oi.user_id,
    SUM(CASE WHEN u.gender = 'M' THEN 1 ELSE null END) AS male,
    SUM(CASE WHEN u.gender = 'F' THEN 1 ELSE null END) AS female,
    u.country AS country
  FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
  INNER JOIN \`former-demo.thelook_ecommerce.users\` AS u 
  ON oi.user_id = u.id
  WHERE oi.status NOT IN ('Cancelled','Returned')
  GROUP BY 1, 4
)

SELECT
  c.country,
  COUNT(DISTINCT c.user_id) AS customers_count,
  COUNT(c.female) AS female,
  COUNT(c.male) AS male
FROM cust AS c
GROUP BY 1
ORDER BY 2 DESC`
  },
  {
    name: "Products Cancel and Return by Category",
    description: "Provides the count of cancelled and returned items for each product category. It joins the order_items and products tables and groups the results by product category.",
    query: `SELECT 
    p.category,
    SUM(CASE WHEN oi.status = 'Cancelled' THEN 1 ELSE null END) AS Cancelled,
    SUM(CASE WHEN oi.status = 'Returned' THEN 1 ELSE null END) AS Returned
FROM \`former-demo.thelook_ecommerce.order_items\` oi
    LEFT JOIN \`former-demo.thelook_ecommerce.products\` p
    ON oi.product_id = p.id
GROUP BY 1
ORDER BY 2 DESC;`
  },
  {
    name: "Sales In China Last 3 Weeks",
    description: "Retrieves the number of sales made in China in the last 3 weeks.",
    query: `SELECT 
    COUNT(DISTINCT oi.order_id) AS order_count,
    SUM(oi.sale_price) AS order_revenue
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
LEFT JOIN \`former-demo.thelook_ecommerce.orders\` AS o 
    ON oi.order_id = o.order_id
LEFT JOIN \`former-demo.thelook_ecommerce.users\` AS u 
    ON o.user_id = u.id
WHERE oi.status NOT IN ('Cancelled','Returned')
    AND DATE(oi.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 WEEK)
    AND u.country = 'China'`
  },
  {
    name: "Recent Five Orders",
    description: "Retrieves the last five orders made in the system based on the creation timestamp, providing essential details including the order ID, user ID associated with each order, and the order creation timestamp.",
    query: `SELECT /* Selecting necessary columns for order identification and timestamps */
 order_id,
 user_id,
 gender,
FROM
 \`former-demo.thelook_ecommerce.orders\` /* Specifying the table from which to retrieve the orders */
ORDER BY 
 created_at DESC /* Sorting the orders by creation day, nearest first */
LIMIT 5 /* Limiting the results to the last five orders only */`
  },
  {
    name: "Customers by Age Group",
    description: "Segments customers into age groups (Kids, Teenager, Adult, Eldery) based on their age and counts the number of unique customers in each group. It joins the order_items and users tables and excludes cancelled and returned orders.",
    query: `SELECT
  CASE 
    WHEN u.age <15 THEN 'Kids'
    WHEN u.age BETWEEN 15 AND 24 THEN 'Teenager'
    WHEN u.age BETWEEN 25 AND 50 THEN 'Adult'
    WHEN u.age >50 THEN 'Eldery'
  END AS age_group,
  COUNT(DISTINCT oi.user_id) total_customers
FROM \`former-demo.thelook_ecommerce.order_items\` oi
LEFT JOIN \`former-demo.thelook_ecommerce.users\` u
ON oi.user_id = u.id
WHERE oi.status NOT IN ('Cancelled','Returned')
GROUP BY 1
ORDER BY 2 DESC`
  },
  {
    name: "Total Sales Per Traffic Source Per Country",
    description: "This query calculates the total sales for each traffic source segmented by country, excluding cancelled and returned orders. It joins the order_items, orders, and users tables and groups the results by traffic source and country.",
    query: `SELECT
  u.traffic_source AS traffic_source,
  u.country AS country,
  SUM(oi.sale_price) AS total_sales_revenue
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
LEFT JOIN \`former-demo.thelook_ecommerce.orders\` AS o ON oi.order_id = o.order_id
LEFT JOIN \`former-demo.thelook_ecommerce.users\` AS u ON o.user_id = u.id
WHERE oi.status NOT IN ('Cancelled','Returned')
GROUP BY 1, 2
ORDER BY traffic_source, country`
  },
  {
    name: "Sales by Gender",
    description: "Aggregates sales revenue and quantity of items purchased, categorized by customer gender. It joins the order_items and orders tables, excluding cancelled and returned orders, and groups the data by gender.",
    query: `SELECT 
 o.gender,
 SUM(oi.sale_price) revenue,
 COUNT(oi.id) as quantity_of_items
FROM \`former-demo.thelook_ecommerce.order_items\` oi
LEFT JOIN \`former-demo.thelook_ecommerce.orders\` o
ON oi.order_id = o.order_id
WHERE oi.status NOT IN ('Cancelled','Returned')
GROUP BY 1
ORDER BY 2`
  },
  {
    name: "Unique Orders Total Revenue And Profit",
    description: "Unique Orders Total Revenue And Profit",
    query: `SELECT
  oi.order_id AS unique_order_id,
  o.user_id AS user_id,
  SUM(oi.sale_price) AS total_order_revenue,
  SUM(oi.sale_price - ii.cost) AS total_order_profit
FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
JOIN \`former-demo.thelook_ecommerce.orders\` AS o ON oi.order_id = o.order_id
JOIN \`former-demo.thelook_ecommerce.inventory_items\` AS ii ON oi.inventory_item_id = ii.id
WHERE oi.status NOT IN ('Cancelled', 'Returned')
  AND DATE(oi.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 MONTH)
GROUP BY oi.order_id, o.user_id`
  },
  {
    name: "Best Selling Products Last 6 Months",
    description: "Finds the top 10 best-selling products over the last 6 months, grouping by product ID and name and ordering by the number of items sold in descending order. Utilizes the 'products' and 'order_items' tables from the 'former-demo.thelook_ecommerce' dataset.",
    query: `WITH ProductSales AS (
  SELECT 
    p.id AS product_id, 
    p.name AS product_name, 
    COUNT(oi.id) AS num_of_items_sold
  FROM 
    \`former-demo.thelook_ecommerce.products\` AS p
  INNER JOIN 
    \`former-demo.thelook_ecommerce.order_items\` AS oi
  ON 
    p.id = oi.product_id
  WHERE 
    DATE(oi.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH) -- Filter for the last 6 months
  GROUP BY 
    p.id, p.name
)
SELECT 
  product_id, 
  product_name, 
  num_of_items_sold
FROM 
  ProductSales
ORDER BY 
  num_of_items_sold DESC
LIMIT 10 -- Show the top 10 best-selling products`
  },
  {
    name: "Brands Cancel and Return",
    description: "Counts the number of cancelled and returned items for each brand. It joins the order_items and products tables and groups the data by brand.",
    query: `SELECT 
  p.brand,
  SUM(CASE WHEN oi.status = 'Cancelled' THEN 1 ELSE null END) AS Cancelled,
  SUM(CASE WHEN oi.status = 'Returned' THEN 1 ELSE null END) AS Returned
FROM \`former-demo.thelook_ecommerce.order_items\` oi
LEFT JOIN \`former-demo.thelook_ecommerce.products\` p
ON oi.product_id = p.id
GROUP BY 1
ORDER BY 2 DESC`
  },
  {
    name: "Total Inventory Value Of Unsold Items Last Year",
    description: "This query calculates the sum of the cost for all inventory items that have not been sold or referenced in an order in the last year. The query uses a left join between the inventory_items and a subquery on order_items to exclude any inventory items that have been sold in the last year.",
    query: `SELECT
  SUM(ii.cost) AS total_inventory_value
FROM \`former-demo.thelook_ecommerce.inventory_items\` AS ii
LEFT JOIN (
  SELECT DISTINCT inventory_item_id
  FROM \`former-demo.thelook_ecommerce.order_items\`
  WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)
) AS recent_sales
ON ii.id = recent_sales.inventory_item_id
WHERE recent_sales.inventory_item_id IS NULL`
  },
  {
    name: "Increase In Sold Items This Quarter Vs Last Year",
    description: "Calculates the percentage increase in quantity of items sold by category for the current quarter compared to the same quarter in the previous year.",
    query: `WITH CurrentQuarterData AS (
    SELECT 
        p.category,
        COUNT(oi.id) AS quantity_this_quarter
    FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
    LEFT JOIN \`former-demo.thelook_ecommerce.products\` AS p
    ON oi.product_id = p.id
    WHERE oi.status NOT IN ('Cancelled','Returned')
    AND DATE(oi.created_at) >= DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 1 QUARTER), QUARTER) -- Current quarter's start date
    AND DATE(oi.created_at) < DATE_TRUNC(CURRENT_DATE(), QUARTER) -- Current quarter's end date
    GROUP BY p.category
),
LastYearQuarterData AS (
    SELECT 
        p.category,
        COUNT(oi.id) AS quantity_last_year_quarter
    FROM \`former-demo.thelook_ecommerce.order_items\` AS oi
    LEFT JOIN \`former-demo.thelook_ecommerce.products\` AS p
    ON oi.product_id = p.id
    WHERE oi.status NOT IN ('Cancelled','Returned')
    -- Calculating the same quarter of the last year
    AND DATE(oi.created_at) >= DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR), QUARTER)
    AND DATE(oi.created_at) < DATE_ADD(DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR), QUARTER), INTERVAL 1 QUARTER)
    GROUP BY p.category
)
-- Calculate the percentage increase in quantity between the quarters
SELECT 
    cqd.category AS category,
    cqd.quantity_this_quarter AS current_quantity,
    lyqd.quantity_last_year_quarter AS last_year_quantity,
    ROUND(((cqd.quantity_this_quarter - lyqd.quantity_last_year_quarter) / lyqd.quantity_last_year_quarter) * 100, 2) AS percentage_growth
FROM CurrentQuarterData cqd
LEFT JOIN LastYearQuarterData lyqd
ON cqd.category = lyqd.category
-- Ensuring we only present categories that existed last year as well to compare accurately
WHERE lyqd.quantity_last_year_quarter IS NOT NULL
ORDER BY percentage_growth DESC`
  }
];