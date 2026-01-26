import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-64 z-40 flex h-16 items-center border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">
          שלום, {user?.firstName}
        </h1>
        {/* Placeholder for future header actions, e.g. notifications */}
      </div>
    </header>
  );
}
