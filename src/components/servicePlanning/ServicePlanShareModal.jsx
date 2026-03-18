import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Download, Mail, MessageSquare, Printer, Share2, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const itemTypeLabels = {
  welcoming_visitors: "Welcoming Visitors", announcements: "Announcements",
  opening_prayer: "Opening Prayer", praise_worship: "Praise & Worship",
  song: "Song", prayer: "Prayer", sermon: "Sermon/Message",
  offering: "Offering", financial_stewardship: "Financial Stewardship",
  scripture_reading: "Scripture Reading", communion: "Communion",
  baptism: "Baptism", special_music: "Special Music", video: "Video",
  testimony: "Testimony", children_dismissal: "Children Dismissal",
  greeting: "Greeting/Welcome", benediction: "Benediction/Closing",
  altar_call: "Altar Call", intercessory_prayer: "Intercessory Prayer",
  prophetic_moment: "Prophetic Moment", tithes_collection: "Tithes Collection", other: "Other"
};

const positionLabels = {
  worship_leader: "Worship Leader", vocals: "Vocals", guitar: "Guitar",
  bass: "Bass", drums: "Drums", keyboard: "Keyboard/Piano",
  sound_tech: "Sound Tech", video_tech: "Video Tech", lights: "Lighting",
  greeter: "Greeter", usher: "Usher", communion_server: "Communion Server",
  prayer_team: "Prayer Team", kids_ministry: "Kids Ministry",
  parking_team: "Parking Team", announcer: "Announcer",
  offering_coordinator: "Offering Coordinator", visitor_welcome: "Visitor Welcome Host",
  praise_leader: "Praise Leader", scripture_reader: "Scripture Reader",
  testimony_speaker: "Testimony Speaker", intercessor: "Intercessor",
  media_operator: "Media Operator", hospitality: "Hospitality",
  security: "Security", emcee: "Emcee", choir_leader: "Choir Leader", other: "Other"
};

export default function ServicePlanShareModal({ plan, serviceItems, teamPositions, churchName, onClose }) {
  const [emailTo, setEmailTo] = useState("");
  const [smsTo, setSmsTo] = useState("");
  const [whatsappTo, setWhatsappTo] = useState("");
  const [sending, setSending] = useState(null);

  const sortedItems = [...serviceItems].sort((a, b) => a.order_index - b.order_index);
  const serviceDate = new Date(plan.service_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const serviceTime = new Date(plan.service_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const totalDuration = sortedItems.reduce((sum, i) => sum + (i.duration_minutes || 0), 0);

  const buildProgramText = () => {
    let text = `📋 ${plan.title}\n`;
    text += `📅 ${serviceDate} at ${serviceTime}\n`;
    if (plan.theme) text += `✨ Theme: "${plan.theme}"\n`;
    if (plan.preacher) text += `🎤 Speaker: ${plan.preacher}\n`;
    if (plan.worship_leader) text += `🎵 Worship Leader: ${plan.worship_leader}\n`;
    text += `⏱ Total Duration: ${totalDuration} min\n\n`;

    text += `── ORDER OF SERVICE ──\n`;
    let runningMin = 0;
    for (const item of sortedItems) {
      const startTime = new Date(new Date(plan.service_date).getTime() + runningMin * 60000);
      const t = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      text += `${t} | ${item.title} (${itemTypeLabels[item.item_type] || item.item_type})`;
      if (item.assigned_to) text += ` – ${item.assigned_to}`;
      text += ` [${item.duration_minutes || 0}min]\n`;
      runningMin += item.duration_minutes || 0;
    }

    if (teamPositions.length > 0) {
      text += `\n── TEAM ROSTER ──\n`;
      for (const pos of teamPositions) {
        const posLabel = pos.custom_position_name || positionLabels[pos.position_name] || pos.position_name;
        text += `${posLabel}: ${pos.assigned_member || 'Unassigned'}`;
        if (pos.response_status === 'accepted') text += ' ✅';
        else if (pos.response_status === 'declined') text += ' ❌';
        text += '\n';
      }
    }

    if (plan.notes) text += `\n📝 Notes: ${plan.notes}`;
    text += `\n\nGod bless! 🙏`;
    return text;
  };

  const buildHtmlProgram = () => {
    let itemRows = '';
    let runningMin = 0;
    for (const item of sortedItems) {
      const startTime = new Date(new Date(plan.service_date).getTime() + runningMin * 60000);
      const t = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      itemRows += `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">${t}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${item.title}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">${itemTypeLabels[item.item_type] || item.item_type}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">${item.assigned_to || '—'}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${item.duration_minutes || 0}m</td></tr>`;
      runningMin += item.duration_minutes || 0;
    }
    let teamRows = '';
    for (const pos of teamPositions) {
      const posLabel = pos.custom_position_name || positionLabels[pos.position_name] || pos.position_name;
      teamRows += `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${posLabel}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${pos.assigned_member || 'Unassigned'}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">${pos.section || '—'}</td></tr>`;
    }
    return `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;"><div style="background:linear-gradient(135deg,#1e3a5f,#3b82f6);padding:30px;border-radius:12px 12px 0 0;text-align:center;"><h1 style="color:white;margin:0;">${churchName}</h1><h2 style="color:rgba(255,255,255,0.9);margin:8px 0 0;">${plan.title}</h2><p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">📅 ${serviceDate} at ${serviceTime}</p></div><div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none;">${plan.theme ? `<p style="font-style:italic;color:#1e40af;background:#f0f9ff;padding:12px;border-radius:8px;border-left:4px solid #3b82f6;">✨ "${plan.theme}"</p>` : ''}<h3 style="border-bottom:2px solid #3b82f6;padding-bottom:8px;">📋 Order of Service</h3><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr style="background:#f8fafc;"><th style="padding:8px;text-align:left;color:#64748b;">Time</th><th style="padding:8px;text-align:left;color:#64748b;">Item</th><th style="padding:8px;text-align:left;color:#64748b;">Type</th><th style="padding:8px;text-align:left;color:#64748b;">Lead By</th><th style="padding:8px;text-align:right;color:#64748b;">Dur.</th></tr></thead><tbody>${itemRows}</tbody></table>${teamRows ? `<h3 style="border-bottom:2px solid #16a34a;padding-bottom:8px;margin-top:24px;">👥 Team Roster</h3><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr style="background:#f8fafc;"><th style="padding:8px;text-align:left;color:#64748b;">Role</th><th style="padding:8px;text-align:left;color:#64748b;">Person</th><th style="padding:8px;text-align:left;color:#64748b;">Section</th></tr></thead><tbody>${teamRows}</tbody></table>` : ''}</div></div>`;
  };

  const handleEmailSend = async () => {
    if (!emailTo) { toast.error("Enter an email address"); return; }
    setSending('email');
    try {
      await base44.integrations.Core.SendEmail({
        to: emailTo,
        subject: `📋 Service Program: ${plan.title} – ${serviceDate}`,
        body: buildHtmlProgram()
      });
      toast.success(`Program sent to ${emailTo}`);
      setEmailTo("");
    } catch (e) { toast.error("Failed to send email"); }
    setSending(null);
  };

  const handlePrint = () => {
    const printContent = buildHtmlProgram();
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${plan.title} - Service Program</title></head><body>${printContent}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleDownloadText = () => {
    const text = buildProgramText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.replace(/\s+/g, '_')}_program.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Program downloaded");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(buildProgramText());
    toast.success("Program copied to clipboard");
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildProgramText());
    const number = whatsappTo ? whatsappTo.replace(/\D/g, '') : '';
    const url = number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Share / Export Program</h2>
            <p className="text-sm text-slate-600">{plan.title} • {serviceDate}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print Program
            </Button>
            <Button onClick={handleDownloadText} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Download (.txt)
            </Button>
            <Button onClick={handleCopyText} variant="outline" className="flex items-center gap-2">
              <Copy className="w-4 h-4" /> Copy to Clipboard
            </Button>
            <Button onClick={handleWhatsApp} variant="outline" className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50">
              <Share2 className="w-4 h-4" /> WhatsApp (my device)
            </Button>
          </div>

          {/* Email section */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
            <Label className="flex items-center gap-2 text-blue-800 font-semibold">
              <Mail className="w-4 h-4" /> Send by Email
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleEmailSend} disabled={sending === 'email'} className="bg-blue-600 hover:bg-blue-700">
                {sending === 'email' ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>

          {/* WhatsApp section */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
            <Label className="flex items-center gap-2 text-green-800 font-semibold">
              <MessageSquare className="w-4 h-4" /> Send via WhatsApp
            </Label>
            <p className="text-xs text-green-700">Enter a phone number (with country code) to open WhatsApp with the program pre-filled, or leave blank to choose on WhatsApp.</p>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="+12125551234 (optional)"
                value={whatsappTo}
                onChange={e => setWhatsappTo(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleWhatsApp} className="bg-green-600 hover:bg-green-700">
                Open WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}