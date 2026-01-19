import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const currentUser = await base44.auth.me();

        if (!currentUser || currentUser.role !== 'admin') {
            return Response.json({ 
                success: false,
                error: 'Only administrators can invite users' 
            }, { status: 403 });
        }

        const body = await req.json();
        const { email, full_name, access_level, permissions, ministry_areas, role = 'user', phone } = body;

        // CRITICAL: Validate role - prevent escalation to admin unless explicitly set
        // Map access_level to Base44 role (admin stays admin, everything else becomes 'user')
        const userRole = (access_level === 'admin' || role === 'admin') ? 'admin' : 'user';

        // Get church name and phone from settings
        let churchName = 'REACH Church Connect';
        let churchPhone = null;
        try {
            const settings = await base44.asServiceRole.entities.ChurchSettings.list();
            if (settings.length > 0) {
                churchName = settings[0].church_name || churchName;
                churchPhone = settings[0].church_phone;
            }
        } catch (err) {
            console.log('Using default church name');
        }

        // Invite user via Base44's built-in invitation system
        // This creates the user account and sends Base44's invitation email with password setup link
        // IMPORTANT: Members get role='user', they join under church's subscription, NOT creating new subscription
        const invitationResult = await base44.users.inviteUser(email, userRole);
        
        console.log('✅ Base44 invitation sent to:', email);

        // Store additional user data (access_level, permissions, ministry_areas) in User entity
        // This will be available after user accepts invitation
        try {
            // Wait a moment for user record to be created
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const users = await base44.asServiceRole.entities.User.filter({ email });
            if (users.length > 0) {
                await base44.asServiceRole.entities.User.update(users[0].id, {
                    access_level: access_level || 'staff',
                    permissions: permissions || {},
                    ministry_areas: ministry_areas || [],
                    full_name: full_name
                });
                console.log('✅ User data updated with permissions and ministry areas');
            }
        } catch (updateError) {
            console.log('⚠️ Could not update user data immediately (will retry on login):', updateError.message);
        }

        // Send branded welcome email from church
        const appUrl = `https://${req.headers.get('host')}`;
        
        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to ${churchName}!</h1>
                </div>
                
                <div style="padding: 40px 20px; background: white;">
                    <p style="font-size: 18px; color: #334155; line-height: 1.6;">
                        Hi ${full_name},
                    </p>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        You've been invited by <strong>${currentUser.full_name}</strong> to join <strong>${churchName}</strong> 
                        on our church management platform as a <strong>${access_level ? access_level.charAt(0).toUpperCase() + access_level.slice(1) : (userRole === 'admin' ? 'Church Administrator' : 'Member')}</strong>!
                    </p>

                    ${ministry_areas && ministry_areas.length > 0 ? `
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        <strong>Ministry Areas:</strong> ${ministry_areas.map(area => area.replace('_', ' ')).join(', ')}
                    </p>
                    ` : ''}
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <p style="font-size: 16px; color: #92400e; margin: 0; font-weight: 600;">
                            📧 Check your email for your invitation link to create your password and complete signup.
                        </p>
                    </div>
                    
                    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <p style="font-size: 14px; color: #1e40af; margin: 0;">
                            <strong>Important:</strong> You're joining as a member under ${churchName}'s account. 
                            You will NOT be creating a new church subscription. After setting up your password, 
                            you'll have access to the ${userRole === 'admin' ? 'admin dashboard to manage the church' : 'member portal to connect with your church community'}.
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        As a member, you'll have access to:
                    </p>
                    
                    <ul style="font-size: 16px; color: #334155; line-height: 1.8;">
                        <li>📅 Church events and calendar</li>
                        <li>🎤 Sermon library</li>
                        <li>💬 Community groups</li>
                        <li>💝 Online giving</li>
                        <li>👥 Member directory</li>
                        <li>📧 Direct messaging</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${appUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                            Go to ${churchName} Portal
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
                        Note: You're joining under ${churchName}'s subscription. After creating your password, you'll be directed to your member dashboard.
                    </p>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        Welcome to the family!<br>
                        <strong>${churchName} Team</strong>
                    </p>
                </div>
                
                <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
                    <p style="margin: 0;">
                        If you have questions, contact ${currentUser.full_name} at ${currentUser.email}
                    </p>
                </div>
            </div>
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            from_name: churchName,
            subject: `Complete Your Signup at ${churchName}! 🎉`,
            body: emailBody
        });

        // Send SMS invitation if phone number provided and Sinch is configured
        if (phone) {
            try {
                const sinchPhone = Deno.env.get('SINCH_PHONE_NUMBER');
                const sinchToken = Deno.env.get('SINCH_API_TOKEN');
                const sinchServicePlan = Deno.env.get('SINCH_SERVICE_PLAN_ID');

                if (sinchPhone && sinchToken && sinchServicePlan) {
                    const smsMessage = `Welcome to ${churchName}! You've been invited to join our church platform. Check your email (${email}) to create your password and complete signup. - ${churchName} Team`;

                    await fetch(`https://us.sms.api.sinch.com/xms/v1/${sinchServicePlan}/batches`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${sinchToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: sinchPhone,
                            to: [phone],
                            body: smsMessage
                        })
                    });

                    console.log('✅ SMS invitation sent to:', phone);
                } else {
                    console.log('⚠️ Sinch not configured, skipping SMS');
                }
            } catch (smsError) {
                console.error('SMS error (non-critical):', smsError);
            }
        }

        return Response.json({ 
            success: true,
            message: 'Invitation sent successfully'
        });

    } catch (error) {
        console.error('Invitation error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});