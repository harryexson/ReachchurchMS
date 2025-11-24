import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * This component handles automatic device registration and heartbeat
 * Include it in kiosk/station pages to enable remote management
 */
export default function DeviceRegistration({ 
    deviceName, 
    deviceType = 'kiosk', 
    location,
    connectedPrinter = null,
    onCommandReceived 
}) {
    const [deviceId, setDeviceId] = useState(null);
    const [isProcessingCommand, setIsProcessingCommand] = useState(false);

    useEffect(() => {
        registerDevice();
        
        // Heartbeat every 5 seconds
        const heartbeat = setInterval(() => {
            updateHeartbeat();
            checkForCommands();
        }, 5000);

        return () => clearInterval(heartbeat);
    }, [deviceName, location, connectedPrinter]);

    const registerDevice = async () => {
        try {
            // Get device info
            const userAgent = navigator.userAgent;
            const os = detectOS(userAgent);
            const browser = detectBrowser(userAgent);
            
            // Try to get IP (best effort)
            let ipAddress = 'Unknown';
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                ipAddress = data.ip;
            } catch (e) {
                console.log('Could not fetch IP');
            }

            // Check if device already exists
            const existingDevices = await base44.entities.ConnectedDevice.filter({
                device_name: deviceName
            });

            let device;
            if (existingDevices.length > 0) {
                // Update existing device
                device = existingDevices[0];
                await base44.entities.ConnectedDevice.update(device.id, {
                    status: 'online',
                    last_seen: new Date().toISOString(),
                    ip_address: ipAddress,
                    os_type: os,
                    browser_type: browser,
                    user_agent: userAgent,
                    location: location,
                    connected_printer: connectedPrinter,
                    is_active: true
                });
            } else {
                // Create new device
                device = await base44.entities.ConnectedDevice.create({
                    device_name: deviceName,
                    device_type: deviceType,
                    location: location,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    os_type: os,
                    browser_type: browser,
                    connected_printer: connectedPrinter,
                    status: 'online',
                    last_seen: new Date().toISOString(),
                    config: {
                        auto_print: true,
                        paper_size: '80mm',
                        print_quality: 'standard'
                    },
                    metrics: {
                        total_prints: 0,
                        failed_prints: 0,
                        uptime_hours: 0
                    }
                });
            }

            setDeviceId(device.id);
            console.log('Device registered:', device.id);
        } catch (error) {
            console.error('Device registration error:', error);
        }
    };

    const updateHeartbeat = async () => {
        if (!deviceId) return;

        try {
            await base44.entities.ConnectedDevice.update(deviceId, {
                status: 'online',
                last_seen: new Date().toISOString(),
                connected_printer: connectedPrinter
            });
        } catch (error) {
            console.error('Heartbeat error:', error);
        }
    };

    const checkForCommands = async () => {
        if (!deviceId || isProcessingCommand) return;

        try {
            const device = await base44.entities.ConnectedDevice.filter({ id: deviceId });
            if (device.length > 0 && device[0].pending_command) {
                setIsProcessingCommand(true);
                await executeCommand(device[0].pending_command);
                
                // Clear command
                await base44.entities.ConnectedDevice.update(deviceId, {
                    pending_command: null,
                    last_activity: new Date().toISOString()
                });
                
                setIsProcessingCommand(false);
            }
        } catch (error) {
            console.error('Command check error:', error);
            setIsProcessingCommand(false);
        }
    };

    const executeCommand = async (command) => {
        console.log('Executing command:', command);

        try {
            switch (command.command_type) {
                case 'test_print':
                    if (onCommandReceived) {
                        await onCommandReceived('test_print', command.command_data);
                    }
                    break;
                
                case 'update_config':
                    if (onCommandReceived) {
                        await onCommandReceived('update_config', command.command_data);
                    }
                    break;
                
                case 'refresh_printer':
                    if (onCommandReceived) {
                        await onCommandReceived('refresh_printer', command.command_data);
                    }
                    break;
                
                case 'restart':
                    window.location.reload();
                    break;
                
                default:
                    console.log('Unknown command:', command.command_type);
            }
        } catch (error) {
            console.error('Command execution error:', error);
        }
    };

    const detectOS = (userAgent) => {
        if (userAgent.indexOf("Win") !== -1) return "Windows";
        if (userAgent.indexOf("Mac") !== -1) return "MacOS";
        if (userAgent.indexOf("Linux") !== -1) return "Linux";
        if (userAgent.indexOf("Android") !== -1) return "Android";
        if (userAgent.indexOf("iPhone") !== -1 || userAgent.indexOf("iPad") !== -1) return "iOS";
        return "Unknown";
    };

    const detectBrowser = (userAgent) => {
        if (userAgent.indexOf("Chrome") !== -1) return "Chrome";
        if (userAgent.indexOf("Safari") !== -1) return "Safari";
        if (userAgent.indexOf("Firefox") !== -1) return "Firefox";
        if (userAgent.indexOf("Edge") !== -1) return "Edge";
        return "Unknown";
    };

    // This component doesn't render anything
    return null;
}