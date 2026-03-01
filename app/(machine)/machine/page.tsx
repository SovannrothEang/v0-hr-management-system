"use client";

import { useState, useEffect } from "react";
import { useMachineQr, QrType } from "@/hooks/use-machine-qr";
import { useSessionStore } from "@/stores/session";
import { useLogout } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { LogOut, RefreshCcw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLES } from "@/lib/constants/roles";

export default function MachinePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isSessionLoading, user } = useSessionStore();
  const logoutMutation = useLogout();
  const [activeTab, setActiveTab] = useState<QrType>("IN");

  const { qrToken, qrUrl, isLoading, refresh } = useMachineQr(activeTab);

  // Guard to ensure only HRMS_API user accesses this page. Wait, if it's admin, that's fine too.
  useEffect(() => {
    // Wait for session to finish loading before making any redirect decisions
    if (isSessionLoading) return;
    
    if (!isAuthenticated) {
      router.replace("/login?logout=true&redirect=/machine");
    } else if (user && !user.roles.includes(ROLES.HRMS_API) && !user.roles.includes("ADMIN")) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  // Show loading spinner while session is loading
  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="outline" onClick={refresh} disabled={isLoading}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh QR
        </Button>
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Exit Kiosk
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center justify-center gap-3">
          <ScanLine className="w-10 h-10 text-primary" />
          Employee Kiosk
        </h1>
        <p className="text-muted-foreground text-lg">Scan the QR code with your mobile app to check in or out.</p>
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <Tabs defaultValue="IN" value={activeTab} onValueChange={(v) => setActiveTab(v as QrType)} className="w-full">
          <CardHeader className="pb-4">
            <TabsList className="grid w-full grid-cols-2 h-14">
              <TabsTrigger value="IN" className="text-lg">Clock In</TabsTrigger>
              <TabsTrigger value="OUT" className="text-lg">Clock Out</TabsTrigger>
            </TabsList>
            <CardTitle className="text-center mt-6 text-2xl">
              {activeTab === "IN" ? "Ready to start your day?" : "Done for the day?"}
            </CardTitle>
            <CardDescription className="text-center text-base">
              Point your camera at the screen to register your attendance.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center pb-10 pt-2">
            <div className={`relative p-8 bg-white rounded-xl shadow-inner border transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
              {qrToken ? (
                <QRCodeSVG 
                  value={qrToken} 
                  size={250} 
                  level="H"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[250px] h-[250px] flex items-center justify-center bg-muted/30">
                  <RefreshCcw className="w-10 h-10 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            <p className="mt-8 text-sm text-muted-foreground animate-pulse">
              QR Code refreshes automatically every minute
            </p>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
