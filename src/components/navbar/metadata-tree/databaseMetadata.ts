import { type DatabaseMetadata } from "@/types/connections";

export const staticDatabaseMetadata: DatabaseMetadata = {
  "projects": [
      {
          "id": "verve-prod",
          "name": "verve-prod",
          "description": null,
          "datasets": [
              {
                  "id": "demo_thelook_ecommerce",
                  "name": "demo_thelook_ecommerce",
                  "description": null,
                  "tableCount": 7,
                  "tables": [
                      {
                          "id": "distribution_centers",
                          "name": "distribution_centers",
                          "description": "The Look fictitious e-commerce dataset: distribution_centers table",
                          "fields": [
                              {
                                  "name": "id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "name",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "latitude",
                                  "type": "FLOAT",
                                  "description": null
                              },
                              {
                                  "name": "longitude",
                                  "type": "FLOAT",
                                  "description": null
                              }
                          ],
                          "includedInAIContext": true
                      },
                      {
                          "id": "events",
                          "name": "events",
                          "description": "Programatically generated web events for The Look fictitious e-commerce store",
                          "fields": [
                              {
                                  "name": "id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "user_id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "sequence_number",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "session_id",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "created_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "ip_address",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "city",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "state",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "postal_code",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "browser",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "traffic_source",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "uri",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "event_type",
                                  "type": "STRING",
                                  "description": null
                              }
                          ],
                          "includedInAIContext": true
                      },
                      {
                          "id": "inventory_items",
                          "name": "inventory_items",
                          "description": "Programatically generated inventory for The Look fictitious e-commerce store",
                          "fields": [
                              {
                                  "name": "id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "product_id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "created_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "sold_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "cost",
                                  "type": "FLOAT",
                                  "description": null
                              },
                              {
                                  "name": "product_category",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "product_name",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "product_brand",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "product_retail_price",
                                  "type": "FLOAT",
                                  "description": null
                              },
                              {
                                  "name": "product_department",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "product_sku",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "product_distribution_center_id",
                                  "type": "INTEGER",
                                  "description": null
                              }
                          ],
                          "includedInAIContext": true
                      },
                      {
                          "id": "order_items",
                          "name": "order_items",
                          "description": "Programatically generated order items for The Look fictitious e-commerce store",
                          "fields": [
                              {
                                  "name": "id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "order_id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "user_id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "product_id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "inventory_item_id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "status",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "created_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "shipped_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "delivered_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "returned_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "sale_price",
                                  "type": "FLOAT",
                                  "description": null
                              }
                          ],
                          "includedInAIContext": true
                      },
                      {
                          "id": "orders",
                          "name": "orders",
                          "description": "Programatically generated orders for The Look fictitious e-commerce store",
                          "fields": [
                              {
                                  "name": "order_id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "user_id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "status",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "gender",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "created_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "returned_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "shipped_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "delivered_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              },
                              {
                                  "name": "num_of_item",
                                  "type": "INTEGER",
                                  "description": null
                              }
                          ],
                          "includedInAIContext": true
                      },
                      {
                          "id": "products",
                          "name": "products",
                          "description": "The Look fictitious e-commerce dataset - products table",
                          "fields": [
                              {
                                  "name": "id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "cost",
                                  "type": "FLOAT",
                                  "description": null
                              },
                              {
                                  "name": "category",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "name",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "brand",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "retail_price",
                                  "type": "FLOAT",
                                  "description": null
                              },
                              {
                                  "name": "department",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "sku",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "distribution_center_id",
                                  "type": "INTEGER",
                                  "description": null
                              }
                          ],
                          "includedInAIContext": true
                      },
                      {
                          "id": "users",
                          "name": "users",
                          "description": "Programatically generated users for The Look fictitious e-commerce store",
                          "fields": [
                              {
                                  "name": "id",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "first_name",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "last_name",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "email",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "age",
                                  "type": "INTEGER",
                                  "description": null
                              },
                              {
                                  "name": "gender",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "state",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "street_address",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "postal_code",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "city",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "country",
                                  "type": "STRING",
                                  "description": "The country of the user. e.g. Australia"
                              },
                              {
                                  "name": "latitude",
                                  "type": "FLOAT",
                                  "description": null
                              },
                              {
                                  "name": "longitude",
                                  "type": "FLOAT",
                                  "description": null
                              },
                              {
                                  "name": "traffic_source",
                                  "type": "STRING",
                                  "description": null
                              },
                              {
                                  "name": "created_at",
                                  "type": "TIMESTAMP",
                                  "description": null
                              }
                          ],
                          "includedInAIContext": true
                      }
                  ]
              },
          ]
      }
  ]
}