import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from 'lucide-react';
import type { ConnectionStatus as ConnectionStatusType } from '@/lib/services/websocket';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
  onReconnect?: () => void;
  latency?: number;
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  reconnectAttempts = 0,
  maxReconnectAttempts = 5,
  onReconnect,
  latency,
  showDetails = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastConnectedTime, setLastConnectedTime] = useState<Date | null>(null);

  // Track when we were last connected
  useEffect(() => {
    if (status === 'connected') {
      setLastConnectedTime(new Date());
    }
  }, [status]);

  // Get connection quality based on latency
  const getConnectionQuality = () => {
    if (!latency || status !== 'connected') return null;
    if (latency < 100) return 'excellent';
    if (latency < 200) return 'good';
    if (latency < 500) return 'fair';
    return 'poor';
  };

  // Get signal icon based on quality
  const getSignalIcon = () => {
    const quality = getConnectionQuality();
    const iconClass = 'h-3 w-3';
    if (!quality) return <Signal className={iconClass} />;
    if (quality === 'excellent') return <SignalHigh className={`${iconClass} text-green-400`} />;
    if (quality === 'good') return <SignalMedium className={`${iconClass} text-blue-400`} />;
    if (quality === 'fair') return <SignalLow className={`${iconClass} text-yellow-400`} />;
    return <Signal className={`${iconClass} text-red-400`} />;
  };

  // Get badge content and styling
  const getBadgeContent = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3 mr-1" />,
          text: 'Connected',
          className: 'bg-green-500/20 text-green-400 border-green-500/30 cursor-pointer',
        };
      case 'connecting':
        return {
          icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />,
          text: 'Connecting...',
          className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer',
        };
      case 'reconnecting':
        return {
          icon: <RefreshCw className="h-3 w-3 mr-1 animate-spin" />,
          text: `Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})`,
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 cursor-pointer',
        };
      case 'disconnected':
      default:
        return {
          icon: <WifiOff className="h-3 w-3 mr-1" />,
          text: 'Disconnected',
          className: 'bg-red-500/20 text-red-400 border-red-500/30 cursor-pointer',
        };
    }
  };

  const badgeContent = getBadgeContent();

  // Format time since last connection
  const getTimeSinceLastConnection = () => {
    if (!lastConnectedTime) return 'Never connected';
    const now = new Date();
    const diff = now.getTime() - lastConnectedTime.getTime();
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} minutes ago`;
    } else {
      return lastConnectedTime.toLocaleTimeString();
    }
  };

  // Compact version without details
  if (!showDetails) {
    return (
      <Badge className={`${badgeContent.className} ${className}`}>
        {badgeContent.icon}
        {badgeContent.text}
      </Badge>
    );
  }

  // Full version with popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Badge className={`${badgeContent.className} ${className}`}>
          {badgeContent.icon}
          {badgeContent.text}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-slate-900 border-slate-800 text-slate-300">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h4 className="font-medium text-white mb-1">Connection Status</h4>
            <p className="text-sm text-slate-400">Real-time WebSocket connection</p>
          </div>

          {/* Connection Details */}
          <div className="space-y-3">
            {/* Current Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-400">Status</span>
              <Badge className={badgeContent.className}>
                {badgeContent.icon}
                {status.toUpperCase()}
              </Badge>
            </div>

            {/* Latency (if connected) */}
            {status === 'connected' && latency !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-400">Latency</span>
                <div className="flex items-center gap-2">
                  {getSignalIcon()}
                  <span className="text-sm text-white font-medium">{latency}ms</span>
                </div>
              </div>
            )}

            {/* Connection Quality */}
            {status === 'connected' && latency !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-400">Quality</span>
                <Badge
                  className={
                    getConnectionQuality() === 'excellent'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : getConnectionQuality() === 'good'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : getConnectionQuality() === 'fair'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }
                >
                  {getConnectionQuality()?.toUpperCase()}
                </Badge>
              </div>
            )}

            {/* Last Connected */}
            {status === 'disconnected' && lastConnectedTime && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-400">Last Connected</span>
                <span className="text-sm text-white">{getTimeSinceLastConnection()}</span>
              </div>
            )}

            {/* Reconnection Attempts */}
            {status === 'reconnecting' && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-400">Attempts</span>
                <span className="text-sm text-white">
                  {reconnectAttempts} / {maxReconnectAttempts}
                </span>
              </div>
            )}
          </div>

          {/* Error Message (if disconnected) */}
          {status === 'disconnected' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/30 border border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Connection Lost</p>
                <p className="text-xs text-red-400/70 mt-1">
                  Real-time updates are unavailable. Please check your internet connection.
                </p>
              </div>
            </div>
          )}

          {/* Max Attempts Reached */}
          {status === 'disconnected' && reconnectAttempts >= maxReconnectAttempts && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/30 border border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Reconnection Failed</p>
                <p className="text-xs text-red-400/70 mt-1">
                  Maximum reconnection attempts reached. Try reconnecting manually.
                </p>
              </div>
            </div>
          )}

          {/* Manual Reconnect Button */}
          {(status === 'disconnected' || status === 'reconnecting') && onReconnect && (
            <Button
              onClick={() => {
                onReconnect();
                setIsOpen(false);
              }}
              disabled={status === 'reconnecting'}
              className="w-full bg-indigo-600 hover:bg-indigo-500"
              size="sm"
            >
              {status === 'reconnecting' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect Now
                </>
              )}
            </Button>
          )}

          {/* Connection Info */}
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
            <p>
              The connection status indicates the real-time WebSocket connection to the server.
              When disconnected, you may need to refresh the page.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Simple inline version
export const ConnectionStatusInline: React.FC<
  Pick<ConnectionStatusProps, 'status' | 'className'>
> = ({ status, className = '' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-400';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-400';
      case 'disconnected':
      default:
        return 'bg-red-400';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`h-2 w-2 rounded-full ${getStatusColor()} animate-pulse`} />
      <span className="text-xs text-slate-400 capitalize">{status}</span>
    </div>
  );
};
