import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Automatically create a testing task when a new hardware item is added with status='testing'
 * This function is called when a new HardwareRecommendation is created
 */

Deno.serve(async (req) => {
    console.log('=== CREATE TESTING TASK ===');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const { hardware_id } = await req.json();
        
        if (!hardware_id) {
            return Response.json({ 
                error: 'Missing required field: hardware_id' 
            }, { status: 400 });
        }

        console.log('Creating testing task for hardware:', hardware_id);

        // Get the hardware item
        const hardwareItems = await base44.asServiceRole.entities.HardwareRecommendation.filter({
            id: hardware_id
        });

        if (hardwareItems.length === 0) {
            return Response.json({ 
                error: 'Hardware item not found' 
            }, { status: 404 });
        }

        const hardware = hardwareItems[0];
        console.log('Hardware found:', hardware.data.product_name);

        // Check if a testing task already exists for this hardware
        const existingTasks = await base44.asServiceRole.entities.TestingTask.filter({
            hardware_id: hardware_id
        });

        if (existingTasks.length > 0) {
            console.log('Testing task already exists for this hardware');
            return Response.json({ 
                success: true,
                message: 'Testing task already exists',
                task: existingTasks[0]
            });
        }

        // Determine priority based on hardware category
        let priority = 'medium';
        if (hardware.data.category === 'thermal_printer') {
            priority = 'high'; // Printers are critical for check-in
        } else if (hardware.data.approximate_price && hardware.data.approximate_price < 100) {
            priority = 'high'; // Budget items get tested quickly
        }

        // Create the testing task
        const taskData = {
            hardware_id: hardware_id,
            hardware_name: hardware.data.product_name,
            hardware_category: hardware.data.category,
            manufacturer: hardware.data.manufacturer,
            model_number: hardware.data.model_number,
            task_status: 'pending',
            priority: priority,
            test_date: null,
            test_start_date: null,
            test_completion_date: null,
            connectivity_test: {
                bluetooth_pairing: 'not_tested',
                wifi_connection: hardware.data.connectivity?.includes('wifi') ? 'not_tested' : 'not_applicable',
                usb_connection: hardware.data.connectivity?.includes('usb') ? 'not_tested' : 'not_applicable',
                connection_stability: null
            },
            functionality_test: {
                print_quality: hardware.data.category === 'thermal_printer' ? 'not_tested' : 'not_applicable',
                print_speed: hardware.data.category === 'thermal_printer' ? 'not_tested' : 'not_applicable',
                qr_code_scanning: 'not_tested',
                barcode_printing: hardware.data.category === 'thermal_printer' ? 'not_tested' : 'not_applicable',
                touch_responsiveness: hardware.data.category.includes('tablet') || hardware.data.category.includes('display') ? 'not_tested' : 'not_applicable',
                display_quality: hardware.data.category.includes('tablet') || hardware.data.category.includes('display') ? 'not_tested' : 'not_applicable',
                battery_life: null
            },
            compatibility_test: {
                kids_checkin: 'not_tested',
                kiosk_giving: 'not_tested',
                event_registration: 'not_tested',
                coffee_shop: 'not_tested',
                kitchen_display: 'not_tested'
            },
            browser_compatibility: {
                chrome: 'not_tested',
                edge: 'not_tested',
                safari: 'not_tested',
                firefox: 'not_tested'
            },
            test_results: '',
            issues_found: [],
            recommended_fixes: '',
            final_status: 'pending',
            overall_rating: null,
            value_for_money: null,
            ease_of_setup: null,
            reliability_score: null,
            tester_notes: `Testing task auto-created for ${hardware.data.product_name}. Please test with Web Bluetooth API and ESC/POS commands.`,
            customer_facing_notes: '',
            test_video_url: null,
            test_images: [],
            assigned_to: null,
            assigned_to_name: null,
            approved_by: null,
            approval_date: null
        };

        const task = await base44.asServiceRole.entities.TestingTask.create(taskData);
        
        console.log('✅ Testing task created successfully:', task.id);

        // Optionally send notification to support team
        try {
            // Get all back office users who can test hardware
            const backOfficeUsers = await base44.asServiceRole.entities.BackOfficeUser.filter({
                is_active: true
            });

            const supportTeam = backOfficeUsers.filter(u => 
                ['support', 'developer', 'super_admin'].includes(u.data.role) &&
                u.data.permissions?.can_view_analytics
            );

            // Send email notification to support team
            for (const teamMember of supportTeam) {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: teamMember.data.user_email,
                    from_name: 'REACH Hardware Testing',
                    subject: `New Hardware Testing Task: ${hardware.data.product_name}`,
                    body: `
Hi ${teamMember.data.full_name},

A new hardware item needs testing:

📦 Product: ${hardware.data.product_name}
🏭 Manufacturer: ${hardware.data.manufacturer}
🔢 Model: ${hardware.data.model_number}
💰 Price: $${hardware.data.approximate_price}
⚡ Priority: ${priority.toUpperCase()}

Category: ${hardware.data.category.replace('_', ' ').toUpperCase()}

Please log in to the Back Office to view the testing task and begin compatibility testing.

Test the following:
- Bluetooth/WiFi connectivity
- Web Bluetooth API compatibility
- ESC/POS command support (for printers)
- Feature compatibility (Kids Check-In, Kiosk Giving, etc.)
- Browser compatibility (Chrome, Edge, Safari, Firefox)

View Task: https://yourdomain.com/testing-tasks

Thanks!
REACH Hardware Team
                    `
                });
            }

            console.log(`Notifications sent to ${supportTeam.length} team members`);
        } catch (notificationError) {
            console.error('Failed to send notifications:', notificationError);
            // Don't fail the whole function if notifications fail
        }

        return Response.json({
            success: true,
            message: 'Testing task created successfully',
            task: task,
            hardware: {
                id: hardware_id,
                name: hardware.data.product_name,
                category: hardware.data.category
            }
        });

    } catch (error) {
        console.error('=== ERROR CREATING TESTING TASK ===');
        console.error(error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});