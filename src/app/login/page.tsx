"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Recycle, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@recycle.local", pass: "admin123456" },
  { role: "PRO Manufacturer", email: "manufacturer@recycle.local", pass: "manuf123456" },
  { role: "Supplier", email: "supplier@recycle.local", pass: "supp123456" },
  { role: "Recycler Admin", email: "recycler@recycle.local", pass: "recyc123456" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@recycle.local");
  const [password, setPassword] = useState("admin123456");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn.email({
      email,
      password,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Unable to sign in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg">
            <Recycle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Sack2Loop Sign In</CardTitle>
            <CardDescription>
              Closed-loop sack recycling and traceability platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Quick Select Demo Role
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <Button
                  key={acc.role}
                  type="button"
                  variant={email === acc.email ? "default" : "outline"}
                  size="sm"
                  className="text-xs justify-start h-auto py-1.5 px-2.5 truncate"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                    setError(null);
                  }}
                >
                  <span className="truncate">{acc.role}</span>
                </Button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="text-destructive text-sm">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground flex items-start gap-2 border">
            <ShieldAlert className="size-4 shrink-0 text-amber-500 mt-0.5" />
            <p>
              <strong>Access Policy:</strong> PRO Manufacturer, Supplier, and Recycler have dedicated login access. Collectors and Farmers do not have login access or self-data-entry capabilities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
