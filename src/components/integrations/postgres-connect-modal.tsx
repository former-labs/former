import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import type { PostgresCredentials } from "@/lib/drivers/clients";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  connectionString: z.string().optional(),
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1, "Port is required"),
  database: z.string().min(1, "Database name is required"),
  user: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function PostgresConnectModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addIntegration } = useData();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      connectionString: "",
      host: "",
      port: 5432,
      database: "",
      user: "",
      password: "",
    },
  });

  const hasConnectionString = !!form.watch("connectionString");

  const parseConnectionString = (connString: string): PostgresCredentials | null => {
    try {
      const regex = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
      const match = regex.exec(connString);

      if (!match) {
        throw new Error('Invalid connection string format');
      }

      const [, user, password, host, port, database] = match;

      return {
        host: decodeURIComponent(host ?? ""),
        port: parseInt(port ?? "5432"),
        database: decodeURIComponent(database ?? ""),
        user: decodeURIComponent(user ?? ""),
        password: decodeURIComponent(password ?? ""),
      };
    } catch (error) {
      console.error('Failed to parse connection string:', error);
      return null;
    }
  };

  const handleConnectionStringChange = (value: string) => {
    form.setValue("connectionString", value);
    const parsed = parseConnectionString(value);
    if (parsed) {
      form.setValue("host", parsed.host);
      form.setValue("port", parsed.port);
      form.setValue("database", parsed.database);
      form.setValue("user", parsed.user);
      form.setValue("password", parsed.password);
    }
  };

  const onSubmit = (values: FormValues) => {
    let credentials: PostgresCredentials;

    if (values.connectionString) {
      const parsed = parseConnectionString(values.connectionString);
      if (!parsed) {
        toast({
          title: "Invalid Connection String",
          description: "Please check your connection string format",
          variant: "destructive",
        });
        return;
      }
      credentials = parsed;
    } else {
      credentials = {
        host: values.host,
        port: values.port,
        database: values.database,
        user: values.user,
        password: values.password,
      };
    }

    addIntegration({
      type: "postgres",
      name: `${credentials.database}@${credentials.host}`,
      credentials,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect PostgreSQL Database</DialogTitle>
          <DialogDescription>
            Connect to your PostgreSQL database using a connection string or individual fields.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="connectionString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection String</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="postgresql://user:password@host:port/database"
                      {...field}
                      onChange={(e) => handleConnectionStringChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or connect with credentials
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={hasConnectionString ? "text-muted-foreground" : ""}>Host</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={hasConnectionString} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={hasConnectionString ? "text-muted-foreground" : ""}>Port</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        disabled={hasConnectionString}
                      />
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
                    <FormLabel className={hasConnectionString ? "text-muted-foreground" : ""}>Database</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={hasConnectionString} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={hasConnectionString ? "text-muted-foreground" : ""}>Username</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={hasConnectionString} />
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
                    <FormLabel className={hasConnectionString ? "text-muted-foreground" : ""}>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          disabled={hasConnectionString}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={hasConnectionString}
                        >
                          {showPassword ? (
                            <EyeOff className={`h-4 w-4 ${hasConnectionString ? "text-muted-foreground" : ""}`} />
                          ) : (
                            <Eye className={`h-4 w-4 ${hasConnectionString ? "text-muted-foreground" : ""}`} />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full">
              Connect
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 