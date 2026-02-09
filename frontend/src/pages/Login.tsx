import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconAlertCircle, IconSchool } from "@tabler/icons-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      const origin = (location.state as any)?.from?.pathname || "/";
      navigate(origin, { replace: true });
    } catch (err: any) {
      setError("שגיאה בהתחברות: שם משתמש או סיסמה שגויים");
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-background p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2">
          <IconSchool /> מערכת בוגרים - מרכז הרב
        </div>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">התחברות למערכת</CardTitle>
          <CardDescription>הזן את פרטי ההתחברות שלך כדי להמשיך</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 mb-8">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <IconAlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                // Password is not verified in mock but typical field included
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "מתחבר..." : "התחבר"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
