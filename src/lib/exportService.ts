import type { License, Device, PiracyAlert } from './mockLicenseService';
import { format as formatDate } from 'date-fns';

export type ExportFormat = 'csv' | 'json' | 'pdf';
export type ExportType = 'licenses' | 'devices' | 'alerts' | 'all';

interface ExportData {
  licenses?: License[];
  devices?: Device[];
  alerts?: PiracyAlert[];
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const convertToCSV = (data: any[], headers: string[]): string => {
  if (data.length === 0) return '';
  
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value ?? '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

const generatePDFContent = (data: ExportData, type: ExportType): string => {
  // Simple HTML that looks like a PDF
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LicenseLock Pro Export</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #3b82f6; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header { text-align: center; margin-bottom: 30px; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LicenseLock Pro Export Report</h1>
        <p>Generated on ${formatDate(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
      </div>
  `;

  if (data.licenses && (type === 'licenses' || type === 'all')) {
    html += `
      <h2>Licenses (${data.licenses.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Key</th>
            <th>Status</th>
            <th>Activations</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${data.licenses.map(l => `
            <tr>
              <td>${l.name}</td>
              <td>${l.key}</td>
              <td>${l.status}</td>
              <td>${l.activations}/${l.maxActivations}</td>
              <td>${formatDate(new Date(l.createdAt), 'MMM dd, yyyy')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  if (data.devices && (type === 'devices' || type === 'all')) {
    html += `
      <h2>Devices (${data.devices.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Device Name</th>
            <th>HWID</th>
            <th>IP Address</th>
            <th>Activated</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          ${data.devices.map(d => `
            <tr>
              <td>${d.deviceName}</td>
              <td>${d.hwid}</td>
              <td>${d.ipAddress}</td>
              <td>${formatDate(new Date(d.activatedAt), 'MMM dd, yyyy')}</td>
              <td>${formatDate(new Date(d.lastSeen), 'MMM dd, yyyy HH:mm')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  if (data.alerts && (type === 'alerts' || type === 'all')) {
    html += `
      <h2>Security Alerts (${data.alerts.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${data.alerts.map(a => `
            <tr>
              <td>${a.type.replace(/_/g, ' ')}</td>
              <td>${a.description}</td>
              <td>${a.severity}</td>
              <td>${a.resolved ? 'Resolved' : 'Active'}</td>
              <td>${formatDate(new Date(a.timestamp), 'MMM dd, yyyy HH:mm')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  html += `
      <div class="footer">
        <p>LicenseLock Pro - Software License Management System</p>
      </div>
    </body>
    </html>
  `;

  return html;
};

export const exportService = {
  export: (data: ExportData, type: ExportType, format: ExportFormat): void => {
    const timestamp = formatDate(new Date(), 'yyyy-MM-dd-HHmmss');
    
    switch (format) {
      case 'csv': {
        if (type === 'licenses' && data.licenses) {
          const csv = convertToCSV(
            data.licenses.map(l => ({
              name: l.name,
              key: l.key,
              status: l.status,
              activations: String(l.activations),
              maxActivations: String(l.maxActivations),
              createdAt: formatDate(new Date(l.createdAt), 'yyyy-MM-dd'),
              expiresAt: l.expiresAt ? formatDate(new Date(l.expiresAt), 'yyyy-MM-dd') : 'Never',
            })),
            ['name', 'key', 'status', 'activations', 'maxActivations', 'createdAt', 'expiresAt']
          );
          downloadFile(csv, `licenses-${timestamp}.csv`, 'text/csv');
        } else if (type === 'devices' && data.devices) {
          const csv = convertToCSV(
            data.devices.map(d => ({
              deviceName: d.deviceName,
              hwid: d.hwid,
              ipAddress: d.ipAddress,
              trusted: d.trusted ? 'Yes' : 'No',
              activatedAt: formatDate(new Date(d.activatedAt), 'yyyy-MM-dd HH:mm'),
              lastSeen: formatDate(new Date(d.lastSeen), 'yyyy-MM-dd HH:mm'),
            })),
            ['deviceName', 'hwid', 'ipAddress', 'trusted', 'activatedAt', 'lastSeen']
          );
          downloadFile(csv, `devices-${timestamp}.csv`, 'text/csv');
        } else if (type === 'alerts' && data.alerts) {
          const csv = convertToCSV(
            data.alerts.map(a => ({
              type: a.type,
              description: a.description,
              severity: a.severity,
              resolved: a.resolved ? 'Yes' : 'No',
              timestamp: formatDate(new Date(a.timestamp), 'yyyy-MM-dd HH:mm'),
            })),
            ['type', 'description', 'severity', 'resolved', 'timestamp']
          );
          downloadFile(csv, `alerts-${timestamp}.csv`, 'text/csv');
        }
        break;
      }
      
      case 'json': {
        const jsonData = JSON.stringify(data, null, 2);
        downloadFile(jsonData, `export-${type}-${timestamp}.json`, 'application/json');
        break;
      }
      
      case 'pdf': {
        const htmlContent = generatePDFContent(data, type);
        downloadFile(htmlContent, `export-${type}-${timestamp}.html`, 'text/html');
        break;
      }
    }
  },
};