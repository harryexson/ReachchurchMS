import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { deviceType = 'all', ipRange = null } = body;

        // Common ports for different device types
        const devicePorts = {
            // Smart TVs
            tv: [
                { port: 8001, protocol: 'samsung', name: 'Samsung Smart TV' },
                { port: 8002, protocol: 'samsung', name: 'Samsung Smart TV' },
                { port: 3000, protocol: 'lg', name: 'LG WebOS TV' },
                { port: 3001, protocol: 'lg', name: 'LG WebOS TV' },
                { port: 7000, protocol: 'vizio', name: 'Vizio SmartCast TV' },
                { port: 9000, protocol: 'vizio', name: 'Vizio SmartCast TV' },
                { port: 8008, protocol: 'chromecast', name: 'Chromecast/Google TV' },
                { port: 8443, protocol: 'chromecast', name: 'Chromecast' },
                { port: 8060, protocol: 'roku', name: 'Roku TV/Device' },
                { port: 55000, protocol: 'firetv', name: 'Amazon Fire TV' },
                { port: 5555, protocol: 'android', name: 'Android TV/Tablet' },
            ],
            // Network Printers
            printer: [
                { port: 9100, protocol: 'raw', name: 'Network Printer (RAW)' },
                { port: 631, protocol: 'ipp', name: 'Network Printer (IPP)' },
                { port: 515, protocol: 'lpd', name: 'Network Printer (LPD)' },
                { port: 80, protocol: 'http', name: 'Network Printer (HTTP)' },
            ],
            // Displays/Tablets
            display: [
                { port: 5555, protocol: 'adb', name: 'Android Device' },
                { port: 8008, protocol: 'cast', name: 'Cast-enabled Display' },
                { port: 7000, protocol: 'airplay', name: 'AirPlay Device' },
            ]
        };

        // Get ports to scan based on device type
        let portsToScan = [];
        if (deviceType === 'all') {
            portsToScan = [...devicePorts.tv, ...devicePorts.printer, ...devicePorts.display];
        } else if (devicePorts[deviceType]) {
            portsToScan = devicePorts[deviceType];
        }

        // Common local network IP ranges to scan
        // In real implementation, we'd detect the actual network range
        const commonRanges = ipRange ? [ipRange] : [
            '192.168.1',
            '192.168.0',
            '10.0.0',
            '10.0.1',
            '172.16.0'
        ];

        const discoveredDevices = [];
        const scanPromises = [];

        // Scan a subset of IPs (1-50) on each range for speed
        for (const range of commonRanges) {
            for (let i = 1; i <= 50; i++) {
                const ip = `${range}.${i}`;
                
                for (const portInfo of portsToScan) {
                    scanPromises.push(
                        checkDevice(ip, portInfo).then(result => {
                            if (result) {
                                discoveredDevices.push(result);
                            }
                        }).catch(() => {
                            // Ignore connection failures
                        })
                    );
                }
            }
        }

        // Wait for all scans with timeout
        await Promise.race([
            Promise.allSettled(scanPromises),
            new Promise(resolve => setTimeout(resolve, 10000)) // 10 second timeout
        ]);

        // Deduplicate by IP
        const uniqueDevices = [];
        const seenIPs = new Set();
        for (const device of discoveredDevices) {
            if (!seenIPs.has(device.ipAddress)) {
                seenIPs.add(device.ipAddress);
                uniqueDevices.push(device);
            }
        }

        return Response.json({ 
            success: true,
            devices: uniqueDevices,
            scannedRanges: commonRanges,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Network scan error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function checkDevice(ip, portInfo) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout per device

    try {
        // Try to connect to the device
        const url = portInfo.protocol === 'https' 
            ? `https://${ip}:${portInfo.port}/`
            : `http://${ip}:${portInfo.port}/`;

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Accept': 'application/json, text/html, */*'
            }
        });

        clearTimeout(timeoutId);

        if (response.ok || response.status === 401 || response.status === 403) {
            // Device responded - it's alive
            let deviceName = portInfo.name;
            let deviceType = 'display';
            let subType = 'tv';
            let capabilities = ['network'];

            // Try to identify the device better
            if (portInfo.protocol === 'samsung') {
                deviceType = 'display';
                subType = 'tv';
                deviceName = `Samsung TV (${ip})`;
                capabilities.push('cast', 'hdmi');
            } else if (portInfo.protocol === 'lg') {
                deviceType = 'display';
                subType = 'tv';
                deviceName = `LG WebOS TV (${ip})`;
                capabilities.push('cast', 'webos');
            } else if (portInfo.protocol === 'vizio') {
                deviceType = 'display';
                subType = 'tv';
                deviceName = `Vizio SmartCast TV (${ip})`;
                capabilities.push('cast', 'smartcast');
            } else if (portInfo.protocol === 'roku') {
                deviceType = 'display';
                subType = 'tv';
                deviceName = `Roku Device (${ip})`;
                capabilities.push('cast', 'roku');
            } else if (portInfo.protocol === 'chromecast') {
                deviceType = 'display';
                subType = 'chromecast';
                deviceName = `Chromecast/Google TV (${ip})`;
                capabilities.push('cast');
            } else if (portInfo.protocol === 'firetv') {
                deviceType = 'display';
                subType = 'firetv';
                deviceName = `Amazon Fire TV (${ip})`;
                capabilities.push('cast', 'firetv');
            } else if (portInfo.protocol === 'android' || portInfo.protocol === 'adb') {
                deviceType = 'display';
                subType = 'tablet';
                deviceName = `Android Device (${ip})`;
                capabilities.push('cast', 'android');
            } else if (['raw', 'ipp', 'lpd'].includes(portInfo.protocol)) {
                deviceType = 'printer';
                subType = 'receipt';
                deviceName = `Network Printer (${ip})`;
                capabilities = ['print', 'network'];
            }

            return {
                id: `wifi-${ip}-${portInfo.port}`,
                name: deviceName,
                type: deviceType,
                subType: subType,
                connectionType: 'wifi',
                ipAddress: ip,
                port: portInfo.port,
                protocol: portInfo.protocol,
                macAddress: null,
                signal: 'strong',
                status: 'available',
                capabilities: capabilities,
                lastSeen: new Date().toISOString()
            };
        }
    } catch (err) {
        clearTimeout(timeoutId);
        // Connection failed or timed out - device not available on this port
    }

    return null;
}