import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, UserPlus, Lock } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Invite admin state
  const [inviteEmail, setInviteEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [showTempPassword, setShowTempPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      // First verify current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("Unable to get current user");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Invalid current password",
          description: "Please enter your correct current password.",
          variant: "destructive",
        });
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error changing password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !tempPassword) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and temporary password.",
        variant: "destructive",
      });
      return;
    }

    if (tempPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Temporary password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("create-admin-user", {
        body: {
          email: inviteEmail,
          password: tempPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create admin user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Admin user created",
        description: `${inviteEmail} can now log in with the temporary password. Remind them to change it.`,
      });

      // Clear form
      setInviteEmail("");
      setTempPassword("");
    } catch (error: any) {
      toast({
        title: "Error creating admin",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and invite new administrators.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Your Password
            </CardTitle>
            <CardDescription>
              Update your account password. You'll need to enter your current password to confirm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" disabled={isChangingPassword} className="w-full">
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invite Admin Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite New Admin
            </CardTitle>
            <CardDescription>
              Create a new admin account with a temporary password. The new admin should change their password after first login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tempPassword">Temporary Password</Label>
                <div className="relative">
                  <Input
                    id="tempPassword"
                    type={showTempPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowTempPassword(!showTempPassword)}
                  >
                    {showTempPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this password securely with the new admin.
                </p>
              </div>

              <Button type="submit" disabled={isInviting} className="w-full">
                {isInviting ? "Creating..." : "Create Admin Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
