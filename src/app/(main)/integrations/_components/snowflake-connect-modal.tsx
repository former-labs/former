"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  type Integration,
  type SnowflakeCredentials,
} from "@/types/connections";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  account: z.string().min(1, "Account is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  warehouse: z.string().min(1, "Warehouse is required"),
  database: z.string().min(1, "Database is required"),
  schema: z.string().min(1, "Schema is required"),
  role: z.string().min(1, "Role is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: Integration;
  onSubmit: (params: {
    id: string | null;
    integration: Omit<Integration, "id" | "createdAt">;
  }) => void;
}

export function SnowflakeConnectModal({
  open,
  onOpenChange,
  integration,
  onSubmit,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: integration?.name ?? "",
      account:
        (integration?.credentials as SnowflakeCredentials)?.account ?? "",
      username:
        (integration?.credentials as SnowflakeCredentials)?.username ?? "",
      password:
        (integration?.credentials as SnowflakeCredentials)?.password ?? "",
      warehouse:
        (integration?.credentials as SnowflakeCredentials)?.warehouse ?? "",
      database:
        (integration?.credentials as SnowflakeCredentials)?.database ?? "",
      schema: (integration?.credentials as SnowflakeCredentials)?.schema ?? "",
      role: (integration?.credentials as SnowflakeCredentials)?.role ?? "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      id: integration?.id ?? null,
      integration: {
        name: values.name,
        type: "snowflake",
        credentials: {
          account: values.account,
          username: values.username,
          password: values.password,
          warehouse: values.warehouse,
          database: values.database,
          schema: values.schema,
          role: values.role,
        } satisfies SnowflakeCredentials,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect to Snowflake</DialogTitle>
          <DialogDescription>
            Enter your Snowflake credentials to connect to your data warehouse.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Snowflake Connection" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <FormControl>
                    <Input placeholder="your-account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="warehouse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse</FormLabel>
                  <FormControl>
                    <Input placeholder="COMPUTE_WH" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="database"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database</FormLabel>
                  <FormControl>
                    <Input placeholder="SNOWFLAKE_SAMPLE_DATA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schema</FormLabel>
                  <FormControl>
                    <Input placeholder="PUBLIC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input placeholder="ACCOUNTADMIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">
                {integration ? "Update Connection" : "Create Connection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
