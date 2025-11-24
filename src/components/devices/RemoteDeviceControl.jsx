import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, Settings, TestTube, Zap, CheckCircle, Loader2 } from "lucide-react";

export default function RemoteDeviceControl({ device, onClose, onRefresh }) {
    const [isSending, setIsSending] = useState(false);
    const [config, setConfig] = useState(device.config || {
        auto_print: true,
        paper_size: '80mm',
        print_quality: 'standard',
        default_printer: ''
    });

    const sendCommand = async (commandType, commandData = {}) => {
        setIsSending(true);
        try {
            const user = await base44.auth.me();
            
            await base44.entities.ConnectedDevice.update(device.id, {
                pending_command: {
                    command_type: commandType,
                    command_data: commandData,
                    issued_at: new Date().toISOString(),
                    issued_by: user.email
                }
            });

            alert('Command sent successfully! The device will execute it on next check-in.');
            onRefresh();
        } catch (error) {
            console.error('Error sending command:', error);
            alert('Failed to send command: ' + error.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleTestPrint = () => {
        sendCommand('test_print', {
            message: 'Test print from admin panel',
            timestamp: new Date().toISOString()
        });
    };

    const handleConfigUpdate = () => {
        sendCommand('update_config', {
            config: config
        });
    };

    const handleRestart = () => {
        if (confirm('Are you sure you want to restart this device?')) {
            sendCommand('restart');
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        Remote Control: {device.device_name}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="commands" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="commands">Quick Commands</TabsTrigger>
                        <TabsTrigger value="config">Configuration</TabsTrigger>
                    </TabsList>

                    <TabsContent value="commands" className="space-y-4 mt-4">
                        <Alert>
                            <CheckCircle className="w-4 h-4" />
                            <AlertDescription>
                                Commands are queued and executed when the device checks in (every 5 seconds)
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                            <Button
                                onClick={handleTestPrint}
                                disabled={isSending}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                {isSending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <TestTube className="w-4 h-4 mr-2" />
                                )}
                                Send Test Print
                            </Button>

                            <Button
                                onClick={() => sendCommand('refresh_printer')}
                                disabled={isSending}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Refresh Printer Connection
                            </Button>

                            <Button
                                onClick={handleRestart}
                                disabled={isSending}
                                className="w-full justify-start text-orange-600"
                                variant="outline"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Restart Device
                            </Button>
                        </div>

                        {device.pending_command && (
                            <Alert className="bg-yellow-50 border-yellow-200">
                                <AlertDescription>
                                    <p className="font-semibold text-yellow-900">Pending Command</p>
                                    <p className="text-sm text-yellow-800">
                                        {device.pending_command.command_type} - 
                                        Issued {new Date(device.pending_command.issued_at).toLocaleString()}
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}
                    </TabsContent>

                    <TabsContent value="config" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <div>
                                <Label>Paper Size</Label>
                                <Select
                                    value={config.paper_size}
                                    onValueChange={(value) => setConfig({...config, paper_size: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="58mm">58mm (2.25")</SelectItem>
                                        <SelectItem value="80mm">80mm (3.15")</SelectItem>
                                        <SelectItem value="4x6">4" x 6" Labels</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Print Quality</Label>
                                <Select
                                    value={config.print_quality}
                                    onValueChange={(value) => setConfig({...config, print_quality: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft (Fast)</SelectItem>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="high">High Quality</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Default Printer</Label>
                                <Input
                                    placeholder="Printer name or IP"
                                    value={config.default_printer}
                                    onChange={(e) => setConfig({...config, default_printer: e.target.value})}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="auto_print"
                                    checked={config.auto_print}
                                    onChange={(e) => setConfig({...config, auto_print: e.target.checked})}
                                    className="rounded"
                                />
                                <Label htmlFor="auto_print">Enable Auto-Print</Label>
                            </div>

                            <Button
                                onClick={handleConfigUpdate}
                                disabled={isSending}
                                className="w-full"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Settings className="w-4 h-4 mr-2" />
                                        Update Configuration
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}