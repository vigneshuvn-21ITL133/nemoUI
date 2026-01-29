import { useState, useEffect } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfileProps {
  collapsed?: boolean;
}

export function UserProfile({ collapsed }: UserProfileProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({
    full_name: null,
    avatar_url: null,
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setProfile({
              full_name: payload.new.full_name,
              avatar_url: payload.new.avatar_url,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || "U";

  if (collapsed) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="end" className="w-56 p-2">
          <div className="p-2">
            <p className="font-medium text-sm">{profile.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Separator className="my-2" />
          <Link to="/settings">
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 border-t border-sidebar-border">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-3 flex-1 min-w-0 p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium text-sm truncate text-sidebar-foreground">
                {profile.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-56 p-2">
          <Link to="/settings">
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
