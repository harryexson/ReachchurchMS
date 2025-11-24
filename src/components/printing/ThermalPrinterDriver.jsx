import { useState, useEffect } from 'react';

/**
 * Thermal Printer Driver for Web Bluetooth
 * Supports ESC/POS compatible printers including:
 * - RONGTA R22
 * - inkwon B21
 * - Jadens JD23
 * - MUNBYN ITPP129
 * - Epson TM-m30II
 * - Star Micronics mC-Print3
 */

class ThermalPrinterDriver {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.encoder = new TextEncoder();
        
        // ESC/POS Commands
        this.ESC = 0x1B;
        this.GS = 0x1D;
        this.LF = 0x0A;
        this.FF = 0x0C;
    }

    /**
     * Check if Web Bluetooth is supported
     */
    isSupported() {
        if (!navigator.bluetooth) {
            console.error('Web Bluetooth API not supported in this browser');
            return false;
        }
        return true;
    }

    /**
     * Connect to a Bluetooth thermal printer
     */
    async connect() {
        if (!this.isSupported()) {
            throw new Error('Web Bluetooth not supported. Please use Chrome, Edge, or Opera browser.');
        }

        try {
            console.log('Requesting Bluetooth printer...');
            
            // Request Bluetooth device
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard printer service
                    { namePrefix: 'RONGTA' },
                    { namePrefix: 'inkwon' },
                    { namePrefix: 'Jadens' },
                    { namePrefix: 'MUNBYN' },
                    { namePrefix: 'Printer' },
                    { namePrefix: 'TM-' }, // Epson
                    { namePrefix: 'mC-Print' }, // Star
                    { namePrefix: 'Star' }
                ],
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb',
                    '49535343-fe7d-4ae5-8fa9-9fafd205e455' // Generic printer service
                ]
            });

            console.log('Connecting to printer:', this.device.name);
            const server = await this.device.gatt.connect();
            
            // Try to get the printer service
            let service;
            try {
                service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            } catch (e) {
                // Try alternate service UUID
                service = await server.getPrimaryService('49535343-fe7d-4ae5-8fa9-9fafd205e455');
            }

            // Get the characteristic for writing
            const characteristics = await service.getCharacteristics();
            this.characteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

            if (!this.characteristic) {
                throw new Error('Could not find writable characteristic on printer');
            }

            console.log('✅ Printer connected successfully:', this.device.name);
            return true;

        } catch (error) {
            console.error('Bluetooth connection error:', error);
            throw new Error(`Failed to connect to printer: ${error.message}`);
        }
    }

    /**
     * Disconnect from printer
     */
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
            console.log('Printer disconnected');
        }
        this.device = null;
        this.characteristic = null;
    }

    /**
     * Check if printer is connected
     */
    isConnected() {
        return this.device && this.device.gatt.connected;
    }

    /**
     * Send raw bytes to printer
     */
    async sendBytes(data) {
        if (!this.isConnected()) {
            throw new Error('Printer not connected');
        }

        try {
            // Split data into chunks (some printers have MTU limits)
            const chunkSize = 512;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                await this.characteristic.writeValue(chunk);
                // Small delay to prevent overwhelming the printer
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } catch (error) {
            console.error('Error sending to printer:', error);
            throw new Error(`Failed to send data to printer: ${error.message}`);
        }
    }

    /**
     * ESC/POS Commands
     */
    
    // Initialize printer
    getInitCommand() {
        return new Uint8Array([this.ESC, 0x40]); // ESC @
    }

    // Set text alignment
    getAlignCommand(align = 'left') {
        const alignCodes = { left: 0, center: 1, right: 2 };
        return new Uint8Array([this.ESC, 0x61, alignCodes[align] || 0]);
    }

    // Set text size
    getTextSizeCommand(width = 1, height = 1) {
        const size = ((width - 1) << 4) | (height - 1);
        return new Uint8Array([this.GS, 0x21, size]);
    }

    // Set bold
    getBoldCommand(enabled = true) {
        return new Uint8Array([this.ESC, 0x45, enabled ? 1 : 0]);
    }

    // Line feed
    getFeedCommand(lines = 1) {
        return new Uint8Array(Array(lines).fill(this.LF));
    }

    // Cut paper (if supported)
    getCutCommand() {
        return new Uint8Array([this.GS, 0x56, 0x00]); // Full cut
    }

    // Print QR Code
    getQRCodeCommands(data, size = 6) {
        const commands = [];
        const qrData = this.encoder.encode(data);
        
        // QR Code model
        commands.push(new Uint8Array([this.GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
        
        // QR Code size
        commands.push(new Uint8Array([this.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]));
        
        // QR Code error correction
        commands.push(new Uint8Array([this.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30]));
        
        // Store QR Code data
        const storeCmd = new Uint8Array([
            this.GS, 0x28, 0x6B,
            (qrData.length + 3) & 0xFF,
            ((qrData.length + 3) >> 8) & 0xFF,
            0x31, 0x50, 0x30,
            ...qrData
        ]);
        commands.push(storeCmd);
        
        // Print QR Code
        commands.push(new Uint8Array([this.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]));
        
        return commands;
    }

    // Print barcode (Code 128)
    getBarcodeCommands(data, height = 50) {
        const commands = [];
        const barcodeData = this.encoder.encode(data);
        
        // Set barcode height
        commands.push(new Uint8Array([this.GS, 0x68, height]));
        
        // Print barcode (Code 128)
        commands.push(new Uint8Array([
            this.GS, 0x6B, 0x49,
            barcodeData.length,
            ...barcodeData
        ]));
        
        return commands;
    }

    /**
     * High-level printing functions
     */

    async printText(text, options = {}) {
        const {
            align = 'left',
            bold = false,
            size = 1,
            feedAfter = 1
        } = options;

        const commands = [];
        
        // Set formatting
        commands.push(this.getAlignCommand(align));
        commands.push(this.getBoldCommand(bold));
        commands.push(this.getTextSizeCommand(size, size));
        
        // Print text
        commands.push(this.encoder.encode(text));
        
        // Feed lines
        if (feedAfter > 0) {
            commands.push(this.getFeedCommand(feedAfter));
        }

        // Flatten all commands into single array
        const totalLength = commands.reduce((sum, cmd) => sum + cmd.length, 0);
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const cmd of commands) {
            buffer.set(cmd, offset);
            offset += cmd.length;
        }

        await this.sendBytes(buffer);
    }

    async printQRCode(data, options = {}) {
        const { size = 6, feedBefore = 1, feedAfter = 1 } = options;

        const commands = [];
        
        // Center align
        commands.push(this.getAlignCommand('center'));
        
        // Feed before
        if (feedBefore > 0) {
            commands.push(this.getFeedCommand(feedBefore));
        }
        
        // QR Code commands
        commands.push(...this.getQRCodeCommands(data, size));
        
        // Feed after
        if (feedAfter > 0) {
            commands.push(this.getFeedCommand(feedAfter));
        }

        // Flatten commands
        const totalLength = commands.reduce((sum, cmd) => sum + cmd.length, 0);
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const cmd of commands) {
            buffer.set(cmd, offset);
            offset += cmd.length;
        }

        await this.sendBytes(buffer);
    }

    async printBarcode(data, options = {}) {
        const { height = 50, feedBefore = 1, feedAfter = 1 } = options;

        const commands = [];
        
        // Center align
        commands.push(this.getAlignCommand('center'));
        
        // Feed before
        if (feedBefore > 0) {
            commands.push(this.getFeedCommand(feedBefore));
        }
        
        // Barcode commands
        commands.push(...this.getBarcodeCommands(data, height));
        
        // Feed after
        if (feedAfter > 0) {
            commands.push(this.getFeedCommand(feedAfter));
        }

        // Flatten commands
        const totalLength = commands.reduce((sum, cmd) => sum + cmd.length, 0);
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const cmd of commands) {
            buffer.set(cmd, offset);
            offset += cmd.length;
        }

        await this.sendBytes(buffer);
    }

    async printDivider(char = '-', length = 32) {
        await this.printText(char.repeat(length), { align: 'center', feedAfter: 1 });
    }

    async cutPaper() {
        const commands = [];
        commands.push(this.getFeedCommand(3)); // Feed a few lines before cut
        commands.push(this.getCutCommand());

        const totalLength = commands.reduce((sum, cmd) => sum + cmd.length, 0);
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const cmd of commands) {
            buffer.set(cmd, offset);
            offset += cmd.length;
        }

        await this.sendBytes(buffer);
    }

    /**
     * Complete receipt templates
     */

    async printKidsCheckInReceipt(data) {
        try {
            // Initialize
            await this.sendBytes(this.getInitCommand());
            
            // Header
            await this.printText('KIDS CHECK-IN', { align: 'center', bold: true, size: 2, feedAfter: 1 });
            await this.printText(data.churchName || 'Church Name', { align: 'center', feedAfter: 1 });
            await this.printDivider();
            
            // Child info
            await this.printText(data.childName, { align: 'center', bold: true, size: 2, feedAfter: 1 });
            await this.printText(`Age: ${data.childAge}`, { align: 'center', feedAfter: 1 });
            
            if (data.allergies) {
                await this.printDivider();
                await this.printText('*** ALLERGY ALERT ***', { align: 'center', bold: true, feedAfter: 0 });
                await this.printText(data.allergies, { align: 'center', feedAfter: 1 });
                await this.printDivider();
            }
            
            // QR Code
            await this.printQRCode(data.checkInCode, { feedBefore: 1, feedAfter: 1 });
            
            // Barcode
            await this.printBarcode(data.checkInCode, { feedBefore: 1, feedAfter: 1 });
            
            // Check-in code
            await this.printText(data.checkInCode, { align: 'center', bold: true, size: 2, feedAfter: 1 });
            
            // Event info
            await this.printDivider();
            await this.printText(data.eventTitle, { align: 'center', feedAfter: 0 });
            await this.printText(`Room: ${data.room || 'TBD'}`, { align: 'center', feedAfter: 0 });
            await this.printText(`Time: ${new Date().toLocaleTimeString()}`, { align: 'center', feedAfter: 1 });
            
            // Cut paper
            await this.cutPaper();
            
            console.log('✅ Kids check-in receipt printed successfully');
            
        } catch (error) {
            console.error('Error printing kids check-in receipt:', error);
            throw error;
        }
    }

    async printDonationReceipt(data) {
        try {
            // Initialize
            await this.sendBytes(this.getInitCommand());
            
            // Header
            await this.printText('DONATION RECEIPT', { align: 'center', bold: true, size: 2, feedAfter: 1 });
            await this.printText(data.churchName || 'Church Name', { align: 'center', feedAfter: 1 });
            await this.printDivider();
            
            // Amount
            await this.printText(`$${data.amount.toFixed(2)}`, { align: 'center', bold: true, size: 3, feedAfter: 1 });
            await this.printText(data.donationType.replace('_', ' ').toUpperCase(), { align: 'center', feedAfter: 1 });
            
            await this.printDivider();
            
            // Donor info
            await this.printText(`Thank you, ${data.donorName}!`, { align: 'center', bold: true, feedAfter: 1 });
            await this.printText(new Date().toLocaleDateString(), { align: 'center', feedAfter: 1 });
            
            // Tax info
            await this.printDivider();
            await this.printText('Tax Deductible Receipt', { align: 'center', feedAfter: 0 });
            await this.printText('Keep for your records', { align: 'center', feedAfter: 1 });
            
            // Cut paper
            await this.cutPaper();
            
            console.log('✅ Donation receipt printed successfully');
            
        } catch (error) {
            console.error('Error printing donation receipt:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const thermalPrinter = new ThermalPrinterDriver();

// React Hook for easy integration
export function useThermalPrinter() {
    const [isConnected, setIsConnected] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setIsSupported(thermalPrinter.isSupported());
    }, []);

    const connect = async () => {
        try {
            setError(null);
            await thermalPrinter.connect();
            setIsConnected(true);
            return true;
        } catch (err) {
            setError(err.message);
            setIsConnected(false);
            return false;
        }
    };

    const disconnect = () => {
        thermalPrinter.disconnect();
        setIsConnected(false);
    };

    const printKidsCheckIn = async (data) => {
        try {
            setError(null);
            await thermalPrinter.printKidsCheckInReceipt(data);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const printDonation = async (data) => {
        try {
            setError(null);
            await thermalPrinter.printDonationReceipt(data);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    return {
        isSupported,
        isConnected,
        error,
        connect,
        disconnect,
        printKidsCheckIn,
        printDonation,
        thermalPrinter // Direct access for advanced usage
    };
}

export default ThermalPrinterDriver;