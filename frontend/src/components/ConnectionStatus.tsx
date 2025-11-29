import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { WifiOff, Wifi, Sparkles } from 'lucide-react';
import { config } from '../lib/config';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    if (config.useMockData) {
      setIsConnected(true);
      return;
    }

    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${config.apiBaseUrl}/api/health`, {
        signal: controller.signal,
      }).catch(() => {
        // If health endpoint doesn't exist, try a basic request
        return fetch(config.apiBaseUrl, {
          signal: controller.signal,
        });
      });
      
      clearTimeout(timeoutId);
      setIsConnected(response.ok || response.status === 404); // 404 is fine, means server is up
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (config.useMockData) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="outline" className="bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-300 shadow-sm">
          <Sparkles className="w-3 h-3 mr-2" />
          Demo Mode
        </Badge>
      </div>
    );
  }

  if (isChecking && isConnected === null) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          <span className="mr-2">🔄</span>
          Checking connection...
        </Badge>
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 cursor-pointer hover:bg-red-100" onClick={checkConnection}>
          <WifiOff className="w-3 h-3 mr-2" />
          Backend Offline - Click to retry
        </Badge>
      </div>
    );
  }

  if (isConnected === true) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <Wifi className="w-3 h-3 mr-2" />
          Connected
        </Badge>
      </div>
    );
  }

  return null;
}
