// Label template generators for different use cases

export const LabelTemplates = {
    // Kids Check-In Label
    kidsCheckIn: (data) => {
        const { child_name, check_in_code, qr_code_url, barcode_url, event_title, location_room, ministry_area, teacher_staff, child_allergies, check_in_time, slip_type = 'child' } = data;
        
        const borderColor = slip_type === 'child' ? '#9333ea' : '#2563eb';
        const bgGradient = slip_type === 'child' ? 'from-purple-50 to-pink-50' : 'from-blue-50 to-indigo-50';
        const title = slip_type === 'child' ? '👶 Kids Check-In' : '👨‍👩‍👧 Parent Pick-Up';
        const copyLabel = slip_type === 'child' ? "CHILD'S COPY" : "PARENT'S COPY";

        return `
<!DOCTYPE html>
<html>
<head>
    <title>Kids Check-In - ${child_name}</title>
    <style>
        @page {
            size: 2.25in 4in;
            margin: 0.1in;
        }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .label {
            width: 2.25in;
            height: 4in;
            border: 3px solid ${borderColor};
            border-radius: 12px;
            padding: 0.15in;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        .header {
            text-align: center;
        }
        .header h1 {
            font-size: 14px;
            font-weight: bold;
            color: ${borderColor};
            margin: 0 0 4px 0;
        }
        .child-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
            margin: 4px 0;
        }
        .event-title {
            font-size: 10px;
            color: #475569;
            margin: 2px 0;
        }
        .qr-code {
            text-align: center;
            margin: 8px 0;
        }
        .qr-code img {
            width: 1.2in;
            height: 1.2in;
        }
        .barcode {
            text-align: center;
            margin: 8px 0;
        }
        .barcode img {
            width: 1.8in;
            height: 0.4in;
        }
        .check-in-code {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 8px 0;
        }
        .allergy-warning {
            background: #fee2e2;
            border: 2px solid #dc2626;
            border-radius: 6px;
            padding: 6px;
            margin: 6px 0;
            text-align: center;
        }
        .allergy-warning .title {
            font-size: 10px;
            font-weight: bold;
            color: #7f1d1d;
            margin: 0 0 2px 0;
        }
        .allergy-warning .text {
            font-size: 9px;
            color: #991b1b;
            margin: 0;
        }
        .details {
            font-size: 9px;
            color: #475569;
            text-align: center;
            line-height: 1.3;
        }
        .copy-label {
            font-size: 9px;
            font-weight: bold;
            text-align: center;
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="label">
        <div class="header">
            <h1>${title}</h1>
            <div class="child-name">${child_name}</div>
            <div class="event-title">${event_title}</div>
        </div>

        <div class="qr-code">
            <img src="${qr_code_url}" alt="QR Code" />
        </div>

        <div class="barcode">
            <img src="${barcode_url}" alt="Barcode" />
        </div>

        <div class="check-in-code">${check_in_code}</div>

        ${child_allergies ? `
        <div class="allergy-warning">
            <p class="title">⚠️ ALLERGY</p>
            <p class="text">${child_allergies}</p>
        </div>
        ` : ''}

        <div class="details">
            ${ministry_area ? `<p>Area: ${ministry_area}</p>` : ''}
            ${location_room ? `<p>Room: ${location_room}</p>` : ''}
            ${teacher_staff ? `<p>Teacher: ${teacher_staff}</p>` : ''}
            ${check_in_time ? `<p>In: ${new Date(check_in_time).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}</p>` : ''}
        </div>

        <div class="copy-label">🎫 ${copyLabel}</div>
    </div>
</body>
</html>
        `;
    },

    // Coffee Shop Receipt
    coffeeShopReceipt: (data) => {
        const { order_number, customer_name, order_items, subtotal, tax_amount, total_amount, order_date, special_instructions, church_name = "Church Café" } = data;

        return `
<!DOCTYPE html>
<html>
<head>
    <title>Receipt #${order_number}</title>
    <style>
        @page {
            size: 3in 8in;
            margin: 0.15in;
        }
        body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
            font-size: 11px;
        }
        .receipt {
            width: 3in;
            padding: 10px;
        }
        .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }
        .logo {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .order-number {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
        }
        .info-line {
            margin: 3px 0;
        }
        .items {
            margin: 15px 0;
        }
        .item {
            margin: 8px 0;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
        }
        .item-customizations {
            margin-left: 10px;
            font-size: 10px;
            color: #666;
        }
        .special-instructions {
            background: #f0f0f0;
            padding: 8px;
            margin: 10px 0;
            border-left: 3px solid #000;
        }
        .totals {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
        }
        .total-line {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        .grand-total {
            font-size: 16px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
        }
        .footer {
            text-align: center;
            border-top: 2px dashed #000;
            padding-top: 10px;
            margin-top: 15px;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo">☕ ${church_name}</div>
            <div class="order-number">#${order_number}</div>
            <div class="info-line">${new Date(order_date).toLocaleString()}</div>
            ${customer_name ? `<div class="info-line">Customer: ${customer_name}</div>` : ''}
        </div>

        <div class="items">
            ${order_items.map(item => `
                <div class="item">
                    <div class="item-header">
                        <span>${item.quantity}x ${item.product_name}</span>
                        <span>$${item.subtotal.toFixed(2)}</span>
                    </div>
                    ${item.customizations && Object.keys(item.customizations).length > 0 ? `
                        <div class="item-customizations">
                            ${item.customizations.size ? `Size: ${item.customizations.size}<br>` : ''}
                            ${item.customizations.extras ? Object.entries(item.customizations.extras).map(([key, val]) => 
                                `${key}: ${val.value}`
                            ).join('<br>') : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        ${special_instructions ? `
        <div class="special-instructions">
            <strong>Special Instructions:</strong><br>
            ${special_instructions}
        </div>
        ` : ''}

        <div class="totals">
            <div class="total-line">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-line">
                <span>Tax:</span>
                <span>$${tax_amount.toFixed(2)}</span>
            </div>
            <div class="total-line grand-total">
                <span>TOTAL:</span>
                <span>$${total_amount.toFixed(2)}</span>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for your order!</p>
            <p>God Bless You</p>
        </div>
    </div>
</body>
</html>
        `;
    },

    // Kitchen Order Ticket
    kitchenOrderTicket: (data) => {
        const { order_number, customer_name, order_items, order_date, special_instructions, is_urgent = false } = data;

        return `
<!DOCTYPE html>
<html>
<head>
    <title>Kitchen Order #${order_number}</title>
    <style>
        @page {
            size: 4in 6in;
            margin: 0.2in;
        }
        body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
        }
        .ticket {
            width: 4in;
            padding: 15px;
            border: ${is_urgent ? '4px solid #dc2626' : '2px solid #000'};
            ${is_urgent ? 'background: #fee2e2;' : ''}
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .urgent-banner {
            background: #dc2626;
            color: white;
            text-align: center;
            padding: 8px;
            font-size: 18px;
            font-weight: bold;
            margin: -15px -15px 15px -15px;
        }
        .order-number {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        .customer {
            font-size: 14px;
            margin: 5px 0;
        }
        .timestamp {
            font-size: 12px;
            color: #666;
        }
        .items-header {
            font-size: 16px;
            font-weight: bold;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin: 15px 0 10px 0;
        }
        .item {
            margin: 12px 0;
            padding: 10px;
            border: 2px solid #000;
            background: white;
        }
        .item-header {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .quantity {
            display: inline-block;
            background: #000;
            color: #fff;
            padding: 4px 12px;
            margin-right: 8px;
            font-size: 20px;
        }
        .customization {
            font-size: 13px;
            margin: 6px 0;
            padding-left: 15px;
            font-weight: bold;
        }
        .special-instructions {
            background: #fef3c7;
            padding: 12px;
            margin: 15px 0;
            border: 3px solid #f59e0b;
            font-size: 14px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            border-top: 3px solid #000;
            padding-top: 10px;
            font-size: 16px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="ticket">
        ${is_urgent ? '<div class="urgent-banner">⚠️ URGENT ORDER ⚠️</div>' : ''}
        
        <div class="header">
            <div class="order-number">#${order_number}</div>
            ${customer_name ? `<div class="customer">Customer: ${customer_name}</div>` : ''}
            <div class="timestamp">${new Date(order_date).toLocaleString()}</div>
        </div>

        <div class="items-header">ITEMS TO PREPARE:</div>

        ${order_items.map(item => `
            <div class="item">
                <div class="item-header">
                    <span class="quantity">${item.quantity}</span>
                    ${item.product_name}
                </div>
                ${item.customizations?.size ? `<div class="customization">► SIZE: ${item.customizations.size.toUpperCase()}</div>` : ''}
                ${item.customizations?.extras ? Object.entries(item.customizations.extras).map(([key, value]) => 
                    `<div class="customization">► ${key.toUpperCase()}: ${value.value.toUpperCase()}</div>`
                ).join('') : ''}
            </div>
        `).join('')}

        ${special_instructions ? `
        <div class="special-instructions">
            ⚠️ SPECIAL INSTRUCTIONS:<br>
            ${special_instructions}
        </div>
        ` : ''}

        <div class="footer">
            TOTAL ITEMS: ${order_items.reduce((sum, item) => sum + item.quantity, 0)}
        </div>
    </div>
</body>
</html>
        `;
    },

    // Event Registration Badge
    eventRegistrationBadge: (data) => {
        const { registrant_name, event_title, registration_code, qr_code_url, registration_date, special_requirements } = data;

        return `
<!DOCTYPE html>
<html>
<head>
    <title>Event Badge - ${registrant_name}</title>
    <style>
        @page {
            size: 4in 6in;
            margin: 0.25in;
        }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .badge {
            width: 4in;
            height: 6in;
            border: 3px solid #2563eb;
            border-radius: 16px;
            padding: 20px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: linear-gradient(135deg, #ffffff 0%, #dbeafe 100%);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
        }
        .logo {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
        }
        .event-title {
            font-size: 16px;
            color: #475569;
            margin: 5px 0;
        }
        .attendee-name {
            text-align: center;
            font-size: 36px;
            font-weight: bold;
            color: #1e40af;
            margin: 20px 0;
            line-height: 1.2;
        }
        .qr-code {
            text-align: center;
            margin: 20px 0;
        }
        .qr-code img {
            width: 2in;
            height: 2in;
        }
        .registration-code {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 15px 0;
        }
        .special-requirements {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            font-size: 12px;
        }
        .footer {
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="badge">
        <div class="header">
            <div class="logo">🎫 EVENT REGISTRATION</div>
            <div class="event-title">${event_title}</div>
        </div>

        <div class="attendee-name">${registrant_name}</div>

        <div class="qr-code">
            <img src="${qr_code_url}" alt="QR Code" />
        </div>

        <div class="registration-code">${registration_code}</div>

        ${special_requirements ? `
        <div class="special-requirements">
            <strong>Special Requirements:</strong><br>
            ${special_requirements}
        </div>
        ` : ''}

        <div class="footer">
            Registered: ${new Date(registration_date).toLocaleDateString()}<br>
            Please wear this badge during the event
        </div>
    </div>
</body>
</html>
        `;
    }
};

export default LabelTemplates;