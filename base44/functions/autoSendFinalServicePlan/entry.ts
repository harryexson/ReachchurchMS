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

Deno.serve(async (req) => {
  try {
    // This can be called by scheduler (no user auth) or admin
    const base44 = createClientFromRequest(req);
    
    let isScheduled = false;
    let specificPlanId = null;

    try {
      const body = await req.json();
      specificPlanId = body?.service_plan_id || null;
    } catch (_) {
      isScheduled = true;
    }

    // Get all published service plans that haven't had final program sent
    const now = new Date();
    const sixteenHoursFromNow = new Date(now.getTime() + 16 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    let plans = [];
    if (specificPlanId) {
      plans = await base44.asServiceRole.entities.ServicePlan.filter({ id: specificPlanId });
    } else {
      // Get all plans that are published, not yet sent, and upcoming within 16-25 hours
      const allPlans = await base44.asServiceRole.entities.ServicePlan.filter({ published: true, final_program_sent: false });
      plans = allPlans.filter(p => {
        const serviceTime = new Date(p.service_date);
        return serviceTime >= now && serviceTime <= oneDayFromNow;
      });
    }

    let sentCount = 0;

    for (const plan of plans) {
      const serviceTime = new Date(plan.service_date);
      const hoursUntilService = (serviceTime - now) / (1000 * 60 * 60);

      // Only send if within 16-25 hours window (or manual override)
      if (!specificPlanId && (hoursUntilService > 25 || hoursUntilService < 0)) continue;

      // Get church settings for this plan
      const settingsList = await base44.asServiceRole.entities.ChurchSettings.filter({
        church_admin_email: plan.church_admin_email || plan.created_by
      });
      const settings = settingsList[0] || {};
      const churchName = settings.church_name || 'Your Church';

      // Get service items and team positions
      const [serviceItems, teamPositions] = await Promise.all([
        base44.asServiceRole.entities.ServiceItem.filter({ service_plan_id: plan.id }),
        base44.asServiceRole.entities.TeamPosition.filter({ service_plan_id: plan.id })
      ]);

      const sortedItems = serviceItems.sort((a, b) => a.order_index - b.order_index);

      const serviceDate = serviceTime.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const serviceTimeStr = serviceTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const totalDuration = sortedItems.reduce((sum, i) => sum + (i.duration_minutes || 0), 0);

      // Build order of service HTML
      let orderOfServiceHtml = '';
      let runningTime = 0;
      for (const item of sortedItems) {
        const startTime = new Date(serviceTime.getTime() + runningTime * 60000);
        const timeLabel = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const typeLabel = itemTypeLabels[item.item_type] || item.item_type;
        orderOfServiceHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; color: #64748b; font-size: 13px; white-space: nowrap;">${timeLabel}</td>
            <td style="padding: 10px; font-weight: 600; color: #1e293b;">${item.title}</td>
            <td style="padding: 10px; color: #64748b; font-size: 13px;">${typeLabel}</td>
            <td style="padding: 10px; color: #64748b; font-size: 13px;">${item.assigned_to || '—'}</td>
            <td style="padding: 10px; color: #64748b; font-size: 13px; text-align: right;">${item.duration_minutes || 0} min</td>
          </tr>
        `;
        runningTime += item.duration_minutes || 0;
      }

      // Build team roster HTML
      let teamHtml = '';
      for (const pos of teamPositions) {
        const posLabel = pos.custom_position_name || positionLabels[pos.position_name] || pos.position_name;
        const statusColor = pos.response_status === 'accepted' ? '#16a34a' : pos.response_status === 'declined' ? '#dc2626' : '#94a3b8';
        const statusText = pos.response_status === 'accepted' ? 'Confirmed ✅' : pos.response_status === 'declined' ? 'Declined ❌' : 'Pending ⏳';
        teamHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: 600; color: #1e293b;">${posLabel}</td>
            <td style="padding: 10px; color: #475569;">${pos.assigned_member || 'Unassigned'}</td>
            ${pos.section ? `<td style="padding: 10px; color: #64748b; font-size: 13px;">${pos.section}</td>` : '<td></td>'}
            <td style="padding: 10px; font-size: 13px; color: ${statusColor};">${statusText}</td>
          </tr>
        `;
      }

      const programHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: white;">
          <div style="background: linear-gradient(135deg, #1e3a5f, #3b82f6); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🙏 ${churchName}</h1>
            <h2 style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 20px;">${plan.title}</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 16px;">📅 ${serviceDate} at ${serviceTimeStr}</p>
          </div>

          <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            ${plan.theme ? `<div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;"><p style="margin: 0; font-style: italic; color: #1e40af; font-size: 16px;">✨ Theme: "${plan.theme}"</p></div>` : ''}
            
            <div style="margin-bottom: 8px; color: #64748b; font-size: 14px;">Total Duration: ${totalDuration} min</div>
            ${plan.preacher ? `<div style="margin-bottom: 4px; color: #64748b; font-size: 14px;">Speaker/Preacher: <strong style="color: #1e293b;">${plan.preacher}</strong></div>` : ''}
            ${plan.worship_leader ? `<div style="margin-bottom: 24px; color: #64748b; font-size: 14px;">Worship Leader: <strong style="color: #1e293b;">${plan.worship_leader}</strong></div>` : ''}

            <h3 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 24px 0 16px;">📋 Order of Service</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 10px; text-align: left; color: #64748b; font-weight: 600;">Time</th>
                  <th style="padding: 10px; text-align: left; color: #64748b; font-weight: 600;">Item</th>
                  <th style="padding: 10px; text-align: left; color: #64748b; font-weight: 600;">Type</th>
                  <th style="padding: 10px; text-align: left; color: #64748b; font-weight: 600;">Lead By</th>
                  <th style="padding: 10px; text-align: right; color: #64748b; font-weight: 600;">Duration</th>
                </tr>
              </thead>
              <tbody>${orderOfServiceHtml || '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #94a3b8;">No items added yet</td></tr>'}</tbody>
            </table>

            <h3 style="color: #1e293b; border-bottom: 2px solid #16a34a; padding-bottom: 8px; margin: 32px 0 16px;">👥 Team Roster</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 10px; text-align: left; color: #64748b; font-weight: 600;">Role</th>
                  <th style="padding: 10px; text-align: left; color: #64748b; font-weight: 600;">Team Member</th>
                  <th style="padding: 10px; text-align: left; color: #64748b; font-weight: 600;">Section</th>
                  <th style="padding: 10px; text-align: left; color: #64748b; font-weight: 600;">Status</th>
                </tr>
              </thead>
              <tbody>${teamHtml || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #94a3b8;">No team assigned</td></tr>'}</tbody>
            </table>

            ${plan.notes ? `<div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-top: 24px;"><p style="margin: 0; color: #92400e;"><strong>📝 Notes:</strong> ${plan.notes}</p></div>` : ''}
            
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px;">This is the final program for ${plan.title}. Please arrive prepared and on time.</p>
              <p style="color: #94a3b8; font-size: 12px;">God bless you! 🙏</p>
            </div>
          </div>
        </div>
      `;

      // Collect all unique emails to send to
      const emailSet = new Set();
      if (plan.church_admin_email) emailSet.add(plan.church_admin_email);
      if (plan.preacher_email) emailSet.add(plan.preacher_email);
      if (plan.worship_leader_email) emailSet.add(plan.worship_leader_email);
      for (const pos of teamPositions) {
        if (pos.assigned_email) emailSet.add(pos.assigned_email);
      }

      for (const email of emailSet) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `📋 Final Program: ${plan.title} – ${serviceDate}`,
          body: programHtml
        });
      }

      // Mark as sent
      await base44.asServiceRole.entities.ServicePlan.update(plan.id, {
        final_program_sent: true,
        final_program_sent_date: new Date().toISOString()
      });

      sentCount++;
    }

    return Response.json({ 
      success: true, 
      plans_processed: sentCount,
      message: `Final program sent for ${sentCount} service plan(s)`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});