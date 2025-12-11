import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MonthRecord } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';

/**
 * Generate clean, professional HTML content for PDF
 */
function formatPDFContent(monthData: MonthRecord): string {
  const isProfit = monthData.netProfitLoss >= 0;
  const profitColor = isProfit ? '#059669' : '#DC2626';
  const profitBorderColor = isProfit ? '#10B981' : '#EF4444';
  const profitBg = isProfit ? '#ECFDF5' : '#FEF2F2';
  const profitLabelColor = isProfit ? '#065F46' : '#991B1B';
  const profitSign = isProfit ? '+' : '';
  const netCashFlow = monthData.deposits - monthData.withdrawals;
  const statusText = monthData.status === 'active' ? 'Active' : 'Closed';
  const statusBg = monthData.status === 'active' ? '#EEF2FF' : '#F3F4F6';
  const statusColor = monthData.status === 'active' ? '#4F46E5' : '#6B7280';
  const statusBorder = monthData.status === 'active' ? '#C7D2FE' : '#D1D5DB';
  
  return `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 40px;
      color: #1F2937;
      background: #FFFFFF;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .header {
      text-align: center;
      padding-bottom: 30px;
      margin-bottom: 30px;
      border-bottom: 3px solid #4F46E5;
    }
    
    .brand {
      color: #4F46E5;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    
    .title {
      font-size: 36px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }
    
    .status {
      display: inline-block;
      background: ${statusBg};
      color: ${statusColor};
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border: 2px solid ${statusBorder};
    }
    
    .hero {
      background: ${profitBg};
      border: 3px solid ${profitBorderColor};
      border-radius: 12px;
      padding: 36px;
      text-align: center;
      margin-bottom: 32px;
    }
    
    .hero-label {
      font-size: 11px;
      font-weight: 700;
      color: ${profitLabelColor};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    
    .hero-value {
      font-size: 52px;
      font-weight: 800;
      color: ${profitColor};
      margin: 8px 0;
      letter-spacing: -1px;
    }
    
    .hero-percent {
      font-size: 22px;
      font-weight: 700;
      color: ${profitColor};
      margin-top: 6px;
    }
    
    .grid {
      display: table;
      width: 100%;
      margin-bottom: 32px;
      border-spacing: 16px 0;
    }
    
    .grid-item {
      display: table-cell;
      width: 50%;
    }
    
    .stat-box {
      background: #F9FAFB;
      border: 2px solid #E5E7EB;
      border-radius: 10px;
      padding: 24px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 10px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    
    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 10px;
      font-weight: 800;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 2px solid #E5E7EB;
      position: relative;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 50px;
      height: 2px;
      background: #4F46E5;
    }
    
    .card {
      background: #FFFFFF;
      border: 2px solid #E5E7EB;
      border-radius: 10px;
      overflow: hidden;
    }
    
    .row {
      display: table;
      width: 100%;
      padding: 16px 22px;
      border-bottom: 1px solid #F3F4F6;
    }
    
    .row:last-child {
      border-bottom: none;
    }
    
    .row-label {
      display: table-cell;
      color: #4B5563;
      font-size: 14px;
      font-weight: 500;
      width: 60%;
    }
    
    .row-value {
      display: table-cell;
      text-align: right;
      font-weight: 700;
      font-size: 16px;
      color: #111827;
      letter-spacing: -0.3px;
    }
    
    .row-value.profit {
      color: #059669;
    }
    
    .row-value.loss {
      color: #DC2626;
    }
    
    .highlight-row {
      background: #F9FAFB;
      border-left: 4px solid #4F46E5;
    }
    
    .performance-row {
      background: ${profitBg};
      border-left: 4px solid ${profitBorderColor};
    }
    
    .performance-row .row-label {
      font-weight: 700;
      color: ${profitLabelColor};
    }
    
    .performance-row .row-value {
      font-size: 20px;
      font-weight: 800;
      color: ${profitColor};
    }
    
    .notes-section {
      background: #FFFBEB;
      border: 3px solid #FBBF24;
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    
    .notes-title {
      font-size: 10px;
      font-weight: 800;
      color: #92400E;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    
    .notes-text {
      color: #78350F;
      font-size: 14px;
      line-height: 1.7;
      font-style: italic;
      margin: 0;
    }
    
    .footer {
      text-align: center;
      padding-top: 28px;
      margin-top: 32px;
      border-top: 2px solid #E5E7EB;
      page-break-inside: avoid;
    }
    
    .footer-text {
      color: #6B7280;
      font-size: 11px;
      margin: 0 0 8px 0;
    }
    
    .footer-brand {
      color: #4F46E5;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
    }
    
    @media print {
      body {
        padding: 30px;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">📈 Trading P&L Tracker</div>
    <h1 class="title">${monthData.monthName} ${monthData.year}</h1>
    <span class="status">${statusText}</span>
  </div>
  
  <div class="hero">
    <div class="hero-label">Net Profit & Loss</div>
    <div class="hero-value">${profitSign}${formatCurrency(Math.abs(monthData.netProfitLoss))}</div>
    <div class="hero-percent">${profitSign}${formatPercentage(monthData.returnPercentage)} Return</div>
  </div>
  
  <div class="grid">
    <div class="grid-item">
      <div class="stat-box">
        <div class="stat-label">Starting Capital</div>
        <div class="stat-value">${formatCurrency(monthData.startingCapital)}</div>
      </div>
    </div>
    <div class="grid-item">
      <div class="stat-box">
        <div class="stat-label">Ending Capital</div>
        <div class="stat-value">${formatCurrency(monthData.endingCapital)}</div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Capital Summary</div>
    <div class="card">
      <div class="row">
        <span class="row-label">Starting Capital</span>
        <span class="row-value">${formatCurrency(monthData.startingCapital)}</span>
      </div>
      <div class="row">
        <span class="row-label">Ending Capital</span>
        <span class="row-value">${formatCurrency(monthData.endingCapital)}</span>
      </div>
      <div class="row highlight-row">
        <span class="row-label">Gross Change</span>
        <span class="row-value ${monthData.grossChange >= 0 ? 'profit' : 'loss'}">${formatCurrency(monthData.grossChange, true)}</span>
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Cash Flow</div>
    <div class="card">
      <div class="row">
        <span class="row-label">Deposits</span>
        <span class="row-value profit">+${formatCurrency(monthData.deposits)}</span>
      </div>
      <div class="row">
        <span class="row-label">Withdrawals</span>
        <span class="row-value loss">-${formatCurrency(monthData.withdrawals)}</span>
      </div>
      <div class="row highlight-row">
        <span class="row-label">Net Cash Flow</span>
        <span class="row-value ${netCashFlow >= 0 ? 'profit' : 'loss'}">${formatCurrency(netCashFlow, true)}</span>
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Trading Performance</div>
    <div class="card">
      <div class="row performance-row">
        <span class="row-label">Net Profit/Loss</span>
        <span class="row-value">${profitSign}${formatCurrency(Math.abs(monthData.netProfitLoss))}</span>
      </div>
      <div class="row performance-row">
        <span class="row-label">Return on Capital</span>
        <span class="row-value">${profitSign}${formatPercentage(monthData.returnPercentage)}</span>
      </div>
    </div>
  </div>
  
  ${monthData.notes ? `
  <div class="notes-section">
    <div class="notes-title">Notes</div>
    <p class="notes-text">"${monthData.notes}"</p>
  </div>
  ` : ''}
  
  <div class="footer">
    <p class="footer-text">Generated on ${format(new Date(), 'MMMM dd, yyyy \'at\' h:mm a')}</p>
    <p class="footer-brand">Trading P&L Tracker</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate PDF for a specific month
 */
export async function generateMonthlyPDF(monthData: MonthRecord): Promise<string> {
  const html = formatPDFContent(monthData);
  
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });
  
  return uri;
}

/**
 * Share the generated PDF
 */
export async function sharePDF(pdfUri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Trading Report',
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

/**
 * Generate and share PDF in one step
 */
export async function generateAndSharePDF(monthData: MonthRecord): Promise<void> {
  const uri = await generateMonthlyPDF(monthData);
  await sharePDF(uri);
}
