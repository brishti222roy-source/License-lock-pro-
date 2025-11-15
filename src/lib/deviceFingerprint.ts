export interface DeviceFingerprint {
  hwid: string;
  browser: string;
  os: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
}

export const generateDeviceFingerprint = (): DeviceFingerprint => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasHash = '';
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    canvasHash = canvas.toDataURL().slice(-50);
  }

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    canvasHash,
  ];

  const fingerprint = components.join('|');
  const hwid = btoa(fingerprint).slice(0, 32);

  return {
    hwid,
    browser: getBrowserInfo(),
    os: getOSInfo(),
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
  };
};

const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
};

const getOSInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
};

export const getDeviceName = (fingerprint: DeviceFingerprint): string => {
  return `${fingerprint.browser} on ${fingerprint.os}`;
};