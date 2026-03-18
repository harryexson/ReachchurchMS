import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { subscription_id } = await req.json();

        if (!subscription_id) {
            return Response.json({ error: 'Subscription ID required' }, { status: 400 });
        }

        // Get subscription
        const subscription = await base44.asServiceRole.entities.Subscription.get(subscription_id);
        if (!subscription) {
            return Response.json({ error: 'Subscription not found' }, { status: 404 });
        }

        // Get related interactions
        const interactions = await base44.asServiceRole.entities.CustomerInteraction.filter({
            church_name: subscription.church_name
        });

        // Get support tickets
        const tickets = await base44.asServiceRole.entities.SupportTicket.filter({
            church_name: subscription.church_name
        });

        // Get all subscriptions for comparison
        const allSubscriptions = await base44.asServiceRole.entities.Subscription.list();

        console.log('Generating AI insights for:', subscription.church_name);

        // 1. CHURN RISK ANALYSIS
        const churnPrompt = `Analyze this church subscription for churn risk:

Subscription Details:
- Church: ${subscription.church_name}
- Tier: ${subscription.subscription_tier}
- Status: ${subscription.status}
- Monthly Price: $${subscription.monthly_price}
- Trial End: ${subscription.trial_end_date || 'N/A'}
- Member Count: ${subscription.member_count || 'Unknown'}

Recent Interactions (${interactions.length}):
${interactions.slice(0, 5).map(i => `- ${i.interaction_type}: ${i.subject} (${i.outcome})`).join('\n')}

Support Tickets (${tickets.length}):
${tickets.slice(0, 5).map(t => `- ${t.priority} priority: ${t.subject} (${t.status})`).join('\n')}

Based on this data, assess the churn risk and provide:
1. Risk level (low/medium/high/critical)
2. Confidence score (0-100)
3. Key reasons for the risk level
4. Specific recommended actions to reduce churn

Be concise and actionable.`;

        const churnResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: churnPrompt,
            response_json_schema: {
                type: "object",
                properties: {
                    risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    confidence_score: { type: "number" },
                    reasoning: { type: "string" },
                    recommended_action: { type: "string" }
                },
                required: ["risk_level", "confidence_score", "reasoning", "recommended_action"]
            }
        });

        // Save churn insight
        await base44.asServiceRole.entities.CRMInsight.create({
            subscription_id: subscription.id,
            church_name: subscription.church_name,
            church_admin_email: subscription.church_admin_email,
            insight_type: 'churn_risk',
            risk_level: churnResponse.risk_level,
            confidence_score: churnResponse.confidence_score,
            reasoning: churnResponse.reasoning,
            suggested_action: churnResponse.recommended_action,
            is_active: true
        });

        // 2. UPSELL/CROSS-SELL OPPORTUNITIES
        if (subscription.subscription_tier !== 'premium') {
            const upsellPrompt = `Analyze this church subscription for upsell opportunities:

Current Subscription:
- Tier: ${subscription.subscription_tier}
- Monthly Price: $${subscription.monthly_price}
- Member Count: ${subscription.member_count || 'Unknown'}
- Features Used: ${JSON.stringify(subscription.features)}

Usage Patterns from Interactions:
${interactions.slice(0, 5).map(i => `- ${i.subject}`).join('\n')}

Available Tiers:
- Starter: $49/mo (150 members, basic features)
- Growth: $119/mo (750 members, SMS/MMS, video meetings, advanced features)
- Premium: $249/mo (unlimited members, all features, priority support)

Based on their usage and needs, recommend:
1. Which tier they should upgrade to (growth/premium)
2. Why this upgrade makes sense for them
3. Estimated value/ROI
4. Best approach to present this upgrade

Be persuasive and data-driven.`;

            const upsellResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: upsellPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggested_tier: { type: "string" },
                        recommendation: { type: "string" },
                        reasoning: { type: "string" },
                        estimated_value: { type: "number" },
                        confidence_score: { type: "number" }
                    },
                    required: ["suggested_tier", "recommendation", "reasoning", "confidence_score"]
                }
            });

            await base44.asServiceRole.entities.CRMInsight.create({
                subscription_id: subscription.id,
                church_name: subscription.church_name,
                church_admin_email: subscription.church_admin_email,
                insight_type: 'upsell_opportunity',
                confidence_score: upsellResponse.confidence_score,
                recommendation: upsellResponse.recommendation,
                reasoning: upsellResponse.reasoning,
                suggested_tier: upsellResponse.suggested_tier,
                estimated_value: upsellResponse.estimated_value || 0,
                is_active: true
            });
        }

        // 3. CATEGORIZE FEEDBACK FROM TICKETS
        for (const ticket of tickets.slice(0, 3)) {
            if (!ticket.category || ticket.category === 'general') {
                const categorizationPrompt = `Categorize this support ticket:

Subject: ${ticket.subject}
Description: ${ticket.description}
Priority: ${ticket.priority}

Categorize as one of: technical, billing, feature_request, bug_report, general

Also extract sentiment: positive, neutral, negative

Provide tags (comma-separated keywords).`;

                const categorization = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: categorizationPrompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            category: { type: "string" },
                            sentiment: { type: "string" },
                            tags: { type: "string" }
                        },
                        required: ["category", "sentiment", "tags"]
                    }
                });

                // Update ticket with AI categorization
                await base44.asServiceRole.entities.SupportTicket.update(ticket.id, {
                    category: categorization.category,
                    notes: `${ticket.notes || ''}\n[AI] Sentiment: ${categorization.sentiment}, Tags: ${categorization.tags}`
                });
            }
        }

        return Response.json({
            success: true,
            insights_generated: 2,
            tickets_categorized: Math.min(tickets.length, 3)
        });

    } catch (error) {
        console.error('AI insights error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});