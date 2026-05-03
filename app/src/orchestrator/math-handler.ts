import { evaluate } from 'mathjs';

const BLOCKED = /\b(require|import|process|eval|Function|setTimeout|setInterval|fetch|XMLHttpRequest|__dirname|__filename|global|window|document|fs|child_process|os|path|http|https|net|crypto|stream|buffer)\b/i;

function extractExpression(message: string): string | null {
  const patterns = [
    /(?:what(?:'s| is)\s+)?(\d+(?:\.\d+)?)\s*%\s*(?:of|off)\s*(\d+(?:\.\d+)?)/i,
    /(?:convert|change)\s+(\d+(?:\.\d+)?)\s*(km|mi|miles?|kilometers?|kg|lbs?|pounds?|celsius|fahrenheit|cm|inches?|meters?|feet|ft|liters?|gallons?)\s*(?:to|in)\s*(km|mi|miles?|kilometers?|kg|lbs?|pounds?|celsius|fahrenheit|cm|inches?|meters?|feet|ft|liters?|gallons?)/i,
    /(?:calculate|compute|solve|what(?:'s| is)|whats|=)\s*(.+)/i,
    /^[\d\s+\-*/().^%sqrtlogsincoStanexpipiePIe]+$/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        const val = parseFloat(match[1]) / 100;
        const base = parseFloat(match[2]);
        return `${val} * ${base}`;
      }
      if (pattern === patterns[1]) {
        return `${parseFloat(match[1])} ${match[2]} to ${match[3]}`;
      }
      if (pattern === patterns[2]) {
        const expr = match[1].replace(/[?.!]+$/, '').trim();
        if (expr) return expr;
      }
      if (pattern === patterns[3]) {
        return message.trim();
      }
    }
  }

  const cleaned = message.replace(/^(?:what(?:'s| is)|calculate|compute|solve|whats|=)\s+/i, '').replace(/[?.!]+$/, '').trim();
  if (/^[\d\s+\-*/().^%sqrtlogsincoStanexpipiePIe]+$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

function formatNumber(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) {
    return n.toLocaleString();
  }
  const formatted = parseFloat(n.toPrecision(10));
  return formatted.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

const CURRENCY_CODES = /\b(USD|EUR|GBP|INR|JPY|AUD|CAD|CHF|CNY|KRW|BRL|MXN|SGD|HKD|NOK|SEK|DKK|NZD|ZAR|RUB|TRY|THB|MYR|PHP|IDR|VND|AED|SAR|EGP|NGN|KES|GHS|PKR|BDT|LKR|IRR|IQD|ILS|JOD|KWD|OMR|QAR|BHD|TND|MAD|VND|CZK|PLN|HUF|RON|BGN|HRK|ISK|dollar|dollars|euro|euros|pound|pounds|rupee|rupees|yen|won|franc|francs|krona|kronor|ringgit|baht|peso|pesos|rand|ruble|lira|dirham|riyal|shekel|shilling|naira|cedi|dinar|dirhams)\b/i;

export function handleMathQuery(message: string): string {
  if (CURRENCY_CODES.test(message)) {
    return "That looks like a currency conversion. Try asking with the globe 🌐 icon turned on — for example: \"What is 13 USD in INR?\"";
  }

  const expression = extractExpression(message);
  if (!expression) {
    return "I couldn't find a math expression in your message. Try something like \"What's 15% of 2400?\" or \"sqrt(144)\".";
  }

  if (BLOCKED.test(expression)) {
    return "That expression contains unsupported operations.";
  }

  try {
    const result = evaluate(expression);

    if (typeof result === 'number') {
      const formatted = formatNumber(result);
      if (!formatted) {
        return `The result of \`${expression}\` is undefined or infinite.`;
      }
      return `\`${expression}\` = **${formatted}**`;
    }

    if (result && typeof result === 'object' && 'toNumber' in result) {
      const num = (result as { toNumber: () => number }).toNumber();
      const formatted = formatNumber(num);
      return `\`${expression}\` = **${formatted}**`;
    }

    return `\`${expression}\` = **${String(result)}**`;
  } catch {
    return `I couldn't calculate \`${expression}\`. Check the syntax and try again. I support arithmetic, percentages, trigonometry, logarithms, and unit conversions.`;
  }
}
