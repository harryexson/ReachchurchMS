import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { position_id, action, decline_reason, reassign_to_name, reassign_to_email, reassign_reason } = await req.json();

    if (!position_id) {
      return Response.json({ error: 'position_id required' }, { status: 400 });
    }

    const positions = await base44.entities.TeamPosition.filter({ id: position_id });
    if (!positions.length) {
      return Response.json({ error: 'Position not found' }, { status: 404 });
    }

    const position = positions[0];
    const plans = await base44.entities.ServicePlan.filter({ id: position.service_plan_id });
    const plan = plans[0];

    if (!plan) {
      return Response.json({ error: 'Service plan not found' }, { status: 404 });
    }

    const churchSettings = await base44.asServiceRole.entities.ChurchSettings.filter({
      church_admin_email: user.email
    });
    const settings = churchSettings[0] || {};
    const churchName = settings.church_name || 'Your Church';

    const posLabel = position.custom_position_name || positionLabels[position.position_name] || position.position_name;
    const serviceDate = new Date(plan.service_date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const serviceTime = new Date(plan.service_date).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://your-app.com';

    if (action === 'send_notification') {
      // Send initial role assignment notification
      if (!position.assigned_email) {
        return Response.json({ error: 'No email for assigned person' }, { status: 400 });
      }

      const responseToken = crypto.randomUUID();
      const acceptUrl = `${appUrl}/ServiceRoleResponse?token=${responseToken}&action=accept&position=${position_id}`;
      const declineUrl = `${appUrl}/ServiceRoleResponse?token=${responseToken}&action=decline&position=${position_id}`;

      await base44.entities.TeamPosition.update(position_id, {
        notification_sent: true,
        notification_sent_date: new Date().toISOString(),
        response_token: responseToken,
        response_status: 'pending'
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: position.assigned_email,
        subject: `🎯 Role Assignment: ${posLabel} – ${plan.title}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e3a5f, #3b82f6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🙏 ${churchName}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Service Role Assignment</p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="font-size: 16px; color: #1e293b;">Dear <strong>${position.assigned_member}</strong>,</p>
              <p style="color: #475569;">You have been assigned a role in our upcoming service. Please review and respond below:</p>
              
              <div style="background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #1e40af; margin: 0 0 12px;">📋 Your Assignment</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Service:</td><td style="font-weight: 600; color: #1e293b;">${plan.title}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Your Role:</td><td style="font-weight: 600; color: #1e293b; font-size: 18px;">🎯 ${posLabel}</td></tr>
                  ${position.section ? `<tr><td style="padding: 6px 0; color: #64748b;">Section:</td><td style="font-weight: 600; color: #1e293b;">${position.section}</td></tr>` : ''}
                  <tr><td style="padding: 6px 0; color: #64748b;">Date:</td><td style="font-weight: 600; color: #1e293b;">${serviceDate}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Time:</td><td style="font-weight: 600; color: #1e293b;">${serviceTime}</td></tr>
                  ${plan.rehearsal_date ? `<tr><td style="padding: 6px 0; color: #64748b;">Rehearsal:</td><td style="font-weight: 600; color: #dc2626;">${new Date(plan.rehearsal_date).toLocaleString()}</td></tr>` : ''}
                  ${position.notes ? `<tr><td style="padding: 6px 0; color: #64748b;">Notes:</td><td style="color: #1e293b;">${position.notes}</td></tr>` : ''}
                </table>
              </div>

              <p style="color: #475569; margin: 20px 0 12px;"><strong>Please respond by clicking one of the buttons below:</strong></p>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${acceptUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 8px;">✅ I Accept This Role</a>
                <a href="${declineUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 8px;">❌ I Need to Decline</a>
              </div>

              <p style="color: #94a3b8; font-size: 13px; text-align: center;">You can also request to swap your role with someone else by replying to this email.</p>
            </div>
          </div>
        `
      });

      return Response.json({ success: true, message: 'Notification sent' });
    }

    if (action === 'notify_leader_of_decline') {
      // Notify the admin/leader that someone declined
      if (!user.email) return Response.json({ error: 'No leader email' }, { status: 400 });

      await base44.entities.TeamPosition.update(position_id, {
        response_status: 'declined',
        confirmed: false,
        decline_reason: decline_reason || ''
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `⚠️ Role Declined: ${posLabel} – ${plan.title}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc2626; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">⚠️ Role Declined – Action Required</h2>
            </div>
            <div style="background: white; padding: 24px; border: 1px solid #e2e8f0;">
              <p><strong>${position.assigned_member}</strong> has declined the role of <strong>${posLabel}</strong> for <strong>${plan.title}</strong> (${serviceDate}).</p>
              ${decline_reason ? `<p><strong>Reason:</strong> ${decline_reason}</p>` : ''}
              <p>Please log in to reassign this role to another team member.</p>
              <a href="${appUrl}/ServicePlanDetail?id=${plan.id}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Reassign Role →</a>
            </div>
          </div>
        `
      });

      return Response.json({ success: true });
    }

    if (action === 'notify_leader_of_reassign_request') {
      await base44.entities.TeamPosition.update(position_id, {
        response_status: 'reassign_requested',
        reassign_requested_to: reassign_to_name || '',
        reassign_requested_to_email: reassign_to_email || '',
        reassign_reason: reassign_reason || ''
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `🔄 Reassignment Requested: ${posLabel} – ${plan.title}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f59e0b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">🔄 Role Swap Requested</h2>
            </div>
            <div style="background: white; padding: 24px; border: 1px solid #e2e8f0;">
              <p><strong>${position.assigned_member}</strong> has requested to swap their role of <strong>${posLabel}</strong> for <strong>${plan.title}</strong>.</p>
              ${reassign_to_name ? `<p><strong>Suggested replacement:</strong> ${reassign_to_name} ${reassign_to_email ? `(${reassign_to_email})` : ''}</p>` : ''}
              ${reassign_reason ? `<p><strong>Reason:</strong> ${reassign_reason}</p>` : ''}
              <p>Please review and approve or assign a different person.</p>
              <a href="${appUrl}/ServicePlanDetail?id=${plan.id}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Review Assignment →</a>
            </div>
          </div>
        `
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});