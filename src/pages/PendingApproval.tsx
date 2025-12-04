import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, LogOut, Mail } from "lucide-react";
import { Navigate } from "react-router-dom";

const PendingApproval = () => {
  const { signOut, user } = useAuth();

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Account Pending Approval</CardTitle>
          <CardDescription className="text-base">
            Your account is awaiting approval from the Visitation Coordinator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Thank you for registering! Your account has been created successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              A Visitation Coordinator will review your account and approve it shortly. 
              You'll be able to access the system once approved.
            </p>
          </div>

          {user?.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Registered as: {user.email}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You can sign back in later to check your approval status
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
