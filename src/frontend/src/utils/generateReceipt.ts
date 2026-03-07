import type { Order, UserProfile } from "../backend";
import { OrderStatus } from "../backend";

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.completed:
      return "#16a34a";
    case OrderStatus.pending:
      return "#d97706";
    case OrderStatus.refunded:
      return "#dc2626";
    default:
      return "#6b7280";
  }
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.completed:
      return "Completed";
    case OrderStatus.pending:
      return "Pending";
    case OrderStatus.refunded:
      return "Refunded";
    default:
      return String(status);
  }
}

export function downloadReceipt(params: {
  order: Order;
  listingTitle: string;
  userProfile: UserProfile;
}): void {
  const { order, listingTitle, userProfile } = params;

  const originalAmount = order.amount;
  const discountPercent = order.discountPercent
    ? Number(order.discountPercent)
    : 0;

  // If discounted: amount stored is the final amount, calculate original
  let originalPrice: bigint;
  let savedAmount: bigint;
  let finalAmount: bigint;

  if (discountPercent > 0) {
    // final = original * (1 - discount/100)
    // original = final / (1 - discount/100)
    const factor = 1 - discountPercent / 100;
    originalPrice = BigInt(Math.round(Number(originalAmount) / factor));
    savedAmount = originalPrice - originalAmount;
    finalAmount = originalAmount;
  } else {
    originalPrice = originalAmount;
    savedAmount = 0n;
    finalAmount = originalAmount;
  }

  const receiptDate = formatDate(order.createdAt);
  const statusColor = getStatusColor(order.status);
  const statusLabel = getStatusLabel(order.status);

  const discountRow =
    discountPercent > 0
      ? `
        <tr>
          <td style="padding: 12px 16px; color: #6b7280; font-size: 14px;">Original Price</td>
          <td style="padding: 12px 16px; text-align: right; color: #374151; font-size: 14px;">${formatPrice(originalPrice)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #16a34a; font-size: 14px;">
            Discount Applied
            <span style="background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-left: 8px;">${discountPercent}% off</span>
            ${order.usedDiscountCode ? `<span style="color: #9ca3af; font-size: 12px; margin-left: 4px;">Code: ${order.usedDiscountCode}</span>` : ""}
          </td>
          <td style="padding: 12px 16px; text-align: right; color: #16a34a; font-size: 14px;">−${formatPrice(savedAmount)}</td>
        </tr>
      `
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt #${order.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      padding: 40px 20px;
      color: #111827;
    }
    .receipt {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }
    .header {
      background: #0f172a;
      padding: 32px 40px;
      color: #fff;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      background: #3b82f6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 18px;
      color: #fff;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .receipt-title {
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 4px;
    }
    .receipt-subtitle {
      font-size: 15px;
      color: #cbd5e1;
    }
    .body {
      padding: 32px 40px;
    }
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #9ca3af;
      margin-bottom: 12px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .info-item label {
      display: block;
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 3px;
    }
    .info-item span {
      font-size: 14px;
      color: #111827;
      font-weight: 500;
    }
    .divider {
      height: 1px;
      background: #f3f4f6;
      margin: 24px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    .table-header tr {
      background: #f9fafb;
    }
    .table-header th {
      padding: 10px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #9ca3af;
    }
    .table-header th:last-child {
      text-align: right;
    }
    tbody tr {
      border-bottom: 1px solid #f3f4f6;
    }
    .total-row {
      background: #f9fafb;
    }
    .total-row td {
      padding: 14px 16px;
      font-weight: 700;
      font-size: 16px;
      color: #111827;
    }
    .total-row td:last-child {
      text-align: right;
      color: #3b82f6;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      color: ${statusColor};
      background: ${statusColor}1a;
    }
    .footer {
      padding: 24px 40px;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
      text-align: center;
    }
    .footer p {
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="brand-icon">V</div>
        <span class="brand-name">VaultDrop</span>
      </div>
      <div class="receipt-title">Purchase Receipt</div>
      <div class="receipt-subtitle">Thank you for your purchase!</div>
    </div>

    <!-- Body -->
    <div class="body">

      <!-- Order + Buyer Info -->
      <div class="section">
        <div class="section-title">Order Information</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Order ID</label>
            <span>#${order.id.slice(0, 12).toUpperCase()}</span>
          </div>
          <div class="info-item">
            <label>Date</label>
            <span>${receiptDate}</span>
          </div>
          <div class="info-item">
            <label>Buyer Name</label>
            <span>${userProfile.username}</span>
          </div>
          <div class="info-item">
            <label>Email</label>
            <span>${userProfile.email}</span>
          </div>
          <div class="info-item">
            <label>Status</label>
            <span><span class="status-badge">${statusLabel}</span></span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Line Items -->
      <div class="section">
        <div class="section-title">Items Purchased</div>
        <table>
          <thead class="table-header">
            <tr>
              <th>Product</th>
              <th style="text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 14px 16px; color: #111827; font-weight: 500; font-size: 15px;">${listingTitle}</td>
              <td style="padding: 14px 16px; text-align: right; color: #374151; font-size: 15px;">${formatPrice(originalPrice)}</td>
            </tr>
            ${discountRow}
            <tr class="total-row">
              <td>Total Paid</td>
              <td>${formatPrice(finalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This receipt was generated by <a href="https://caffeine.ai">VaultDrop</a>.<br />
      For support, contact us through your dashboard. Thank you for shopping with us!</p>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${order.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
