export interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) {
    return {
      browser: "Unknown",
      os: "Unknown",
      deviceType: "desktop",
    };
  }

  const uaLower = ua.toLowerCase();

  // 1. Detect Device Type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(uaLower)) {
    deviceType = "tablet";
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(uaLower)) {
    deviceType = "mobile";
  }

  // 2. Detect Operating System
  let os = "Other";
  if (/windows nt 10.0/i.test(uaLower)) os = "Windows 10/11";
  else if (/windows nt 6.3/i.test(uaLower)) os = "Windows 8.1";
  else if (/windows nt 6.2/i.test(uaLower)) os = "Windows 8";
  else if (/windows nt 6.1/i.test(uaLower)) os = "Windows 7";
  else if (/windows/i.test(uaLower)) os = "Windows";
  else if (/iphone|ipad|ipod/i.test(uaLower)) os = "iOS";
  else if (/macintosh|mac os x/i.test(uaLower)) os = "macOS";
  else if (/android/i.test(uaLower)) os = "Android";
  else if (/cros/i.test(uaLower)) os = "Chrome OS";
  else if (/linux/i.test(uaLower)) os = "Linux";

  // 3. Detect Browser
  let browser = "Other";
  if (/edg\//i.test(uaLower)) browser = "Edge";
  else if (/opr\/|opera\//i.test(uaLower)) browser = "Opera";
  else if (/chrome|crios/i.test(uaLower)) browser = "Chrome";
  else if (/firefox|fxios/i.test(uaLower)) browser = "Firefox";
  else if (/safari/i.test(uaLower) && !/chrome|crios|android/i.test(uaLower)) browser = "Safari";
  else if (/samsungbrowser/i.test(uaLower)) browser = "Samsung Internet";
  else if (/brave/i.test(uaLower)) browser = "Brave";

  return {
    browser,
    os,
    deviceType,
  };
}
