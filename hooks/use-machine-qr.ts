import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useSessionStore } from "@/stores/session";
import { toast } from "sonner";

export type QrType = "IN" | "OUT";

interface QrResponse {
  token: string;
  qrUrl?: string;
}

export function useMachineQr(type: QrType) {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useSessionStore();

  const fetchQr = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const endpoint = type === "IN" ? "/attendances/qr/in" : "/attendances/qr/out";
      const res = await apiClient.get<QrResponse>(endpoint);
      
      if (res.success && res.data) {
        setQrToken(res.data.token);
        if (res.data.qrUrl) {
          setQrUrl(res.data.qrUrl);
        } else {
          setQrUrl(null);
        }
      } else {
        toast.error("Failed to generate QR code");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch QR code");
    } finally {
      setIsLoading(false);
    }
  }, [type, isAuthenticated]);

  useEffect(() => {
    fetchQr();
    
    // Refresh every 50 seconds (token expires in 60s)
    const interval = setInterval(() => {
      fetchQr();
    }, 50000);
    
    return () => clearInterval(interval);
  }, [fetchQr]);

  return { qrToken, qrUrl, isLoading, refresh: fetchQr };
}