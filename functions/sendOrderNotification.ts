import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== ORDER NOTIFICATION REQUEST =====`);
    
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { orderId, notificationType } = body;
        // notificationType: 'order_placed', 'order_ready', 'order_completed'

        console.log(`[${requestId}] Order ID: ${orderId}, Type: ${notificationType}`);

        // Get order details
        const order = await base44.asServiceRole.entities.Order.list();
        const targetOrder = order.find(o => o.id === orderId);

        if (!targetOrder) {
            return Response.json({ 
                success: false,
                error: 'Order not found' 
            }, { status: 404 });
        }

        console.log(`[${requestId}] Order found: ${targetOrder.order_number}`);

        // Get church settings for branding
        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        const churchSettings = settings[0] || { church_name: "Church Café" };

        let subject = '';
        let message = '';
        let smsMessage = '';

        // Build message based on notification type
        if (notificationType === 'order_placed') {
            subject = `Order Confirmation #${targetOrder.order_number}`;
            message = `Thank you for your order at ${churchSettings.church_name}!

Order Number: ${targetOrder.order_number}
Order Time: ${new Date(targetOrder.order_date).toLocaleString()}

ITEMS ORDERED:
${targetOrder.order_items?.map(item => 
    `${item.quantity}x ${item.product_name}${item.customizations?.size ? ` (${item.customizations.size})` : ''} - $${item.subtotal.toFixed(2)}`
).join('\n')}

${targetOrder.special_instructions ? `Special Instructions: ${targetOrder.special_instructions}\n` : ''}
Subtotal: $${targetOrder.subtotal.toFixed(2)}
Tax: $${targetOrder.tax_amount.toFixed(2)}
TOTAL: $${targetOrder.total_amount.toFixed(2)}

We'll notify you when your order is ready for pickup!

Estimated wait time: ${calculateEstimatedTime(targetOrder)} minutes

Blessings,
${churchSettings.church_name} Team`;

            smsMessage = `✅ Order #${targetOrder.order_number} confirmed! Total: $${targetOrder.total_amount.toFixed(2)}. We'll text you when it's ready. Estimated: ${calculateEstimatedTime(targetOrder)} min. - ${churchSettings.church_name}`;

        } else if (notificationType === 'order_ready') {
            subject = `Your Order #${targetOrder.order_number} is Ready! 🎉`;
            message = `Great news! Your order is ready for pickup!

Order Number: ${targetOrder.order_number}

Please come to the pickup counter to collect your order.

Thank you for your patience!

${churchSettings.church_name}`;

            smsMessage = `🎉 Order #${targetOrder.order_number} is READY for pickup! Please come to the counter. - ${churchSettings.church_name}`;

        } else if (notificationType === 'order_completed') {
            subject = `Thank You - Order #${targetOrder.order_number}`;
            message = `Thank you for visiting ${churchSettings.church_name}!

We hope you enjoyed your order. Your feedback helps us serve you better.

Order #${targetOrder.order_number}
Total: $${targetOrder.total_amount.toFixed(2)}

We'd love to see you again soon!

Blessings,
${churchSettings.church_name} Team`;

            smsMessage = `Thank you for your order! We hope to see you again soon. - ${churchSettings.church_name}`;
        }

        const results = {
            email: { sent: false, message: '' },
            sms: { sent: false, message: '' }
        };

        // Send Email if customer has email
        if (targetOrder.customer_email && targetOrder.customer_email.includes('@')) {
            try {
                console.log(`[${requestId}] Sending email to ${targetOrder.customer_email}`);
                
                await base44.integrations.Core.SendEmail({
                    from_name: churchSettings.church_name || "Church Café",
                    to: targetOrder.customer_email,
                    subject: subject,
                    body: message
                });

                results.email.sent = true;
                results.email.message = 'Email sent successfully';
                console.log(`[${requestId}] ✅ Email sent`);

            } catch (emailError) {
                console.error(`[${requestId}] Email error:`, emailError);
                results.email.message = emailError.message;
            }
        }

        // Send SMS if customer has phone
        if (targetOrder.customer_phone) {
            try {
                console.log(`[${requestId}] Sending SMS to ${targetOrder.customer_phone}`);
                
                const smsResponse = await base44.functions.invoke('sendSinchSMS', {
                    to: targetOrder.customer_phone,
                    message: smsMessage
                });

                if (smsResponse.data.success) {
                    results.sms.sent = true;
                    results.sms.message = 'SMS sent successfully';
                    console.log(`[${requestId}] ✅ SMS sent`);
                } else {
                    results.sms.message = smsResponse.data.error || 'SMS failed';
                    console.log(`[${requestId}] ❌ SMS failed:`, results.sms.message);
                }

            } catch (smsError) {
                console.error(`[${requestId}] SMS error:`, smsError);
                results.sms.message = smsError.message;
            }
        }

        // Update order to mark notification sent
        const updateData = {};
        if (notificationType === 'order_ready') {
            updateData.notified_customer = true;
        }
        
        if (Object.keys(updateData).length > 0) {
            await base44.asServiceRole.entities.Order.update(orderId, updateData);
        }

        console.log(`[${requestId}] ✅ Notification complete`);

        return Response.json({ 
            success: true,
            results,
            order_number: targetOrder.order_number
        });

    } catch (error) {
        console.error(`[${requestId}] ❌ Error:`, error);
        return Response.json({ 
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});

function calculateEstimatedTime(order) {
    if (!order.order_items || order.order_items.length === 0) return 5;
    
    // Calculate based on items (simple estimation)
    const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(5, Math.min(20, itemCount * 3));
}