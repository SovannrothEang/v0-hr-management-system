"use client";

import { useState, useEffect } from "react";
import { useMachineQr, QrType } from "@/hooks/use-machine-qr";
import { useSessionStore } from "@/stores/session";
import { useLogout } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { LogIn, LogOut, RefreshCcw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      <Card className="w-full max-w-2xl shadow-2xl border-2">
        <Tabs defaultValue="IN" value={activeTab} onValueChange={(v) => setActiveTab(v as QrType)} className="w-full">
          <CardHeader className="pb-4 pt-8">
            <TabsList className="grid w-full grid-cols-2 h-24 p-2 bg-muted/50">
              <TabsTrigger 
                value="IN" 
                className="text-3xl font-black data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all gap-3 h-full rounded-lg shadow-sm"
              >
                <LogIn className="w-8 h-8" />
                Clock In
              </TabsTrigger>
              <TabsTrigger 
                value="OUT" 
                className="text-3xl font-black data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all gap-3 h-full rounded-lg shadow-sm"
              >
                <LogOut className="w-8 h-8" />
                Clock Out
              </TabsTrigger>
            </TabsList>
            <CardTitle className={`text-center mt-10 text-5xl font-black tracking-tight transition-colors duration-300 ${activeTab === "IN" ? "text-emerald-700" : "text-rose-700"}`}>
              {activeTab === "IN" ? "Ready to start?" : "Heading home?"}
            </CardTitle>
            <CardDescription className="text-center text-2xl mt-4 font-medium text-muted-foreground/80">
              {activeTab === "IN" 
                ? "Scan to register your start time" 
                : "Scan to register your finish time"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center pb-12 pt-6">
            <div className={`relative p-10 bg-white rounded-2xl shadow-2xl border-4 border-primary/10 transition-all duration-500 transform ${isLoading ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}`}>
              {qrToken ? (
                <QRCodeSVG 
                  value={qrToken} 
                  size={400} 
                  level="H"
                  includeMargin={true}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-[400px] h-[400px] flex flex-col items-center justify-center bg-muted/20 gap-4">
                  <RefreshCcw className="w-16 h-16 animate-spin text-primary/40" />
                  <p className="text-muted-foreground font-medium">Generating Token...</p>
                </div>
              )}
            </div>
            
            <div className="mt-10 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-full border border-primary/10">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-lg font-semibold text-primary/80 tracking-wide uppercase">
                  Live System Active
                </span>
              </div>
              <p className="text-base text-muted-foreground mt-2">
                QR Code updates every minute for security
              </p>
            </div>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
