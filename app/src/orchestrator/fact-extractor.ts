export interface ExtractedFact {
  fact: string;
  entity: string | null;
  category: string;
}

interface ExtractionPattern {
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => ExtractedFact;
}

const PATTERNS: ExtractionPattern[] = [
  {
    pattern: /my\s+(\w+)\s+(?:is|are|was)\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => {
      const field = m[1].toLowerCase();
      const value = m[2].trim();
      const category = categorizeField(field);
      return { fact: `user's ${field} is ${value}`, entity: value, category };
    },
  },
  {
    pattern: /i\s+(?:am|'m)\s+(?:a\s+|an\s+)?(.+?)(?:\.|!|$)/i,
    extract: (m) => {
      const value = m[1].trim();
      if (value.length < 2 || /^(not|so|very|really|also|just|still|going|getting|having)/i.test(value)) {
        return null!;
      }
      return { fact: `user is ${value}`, entity: value, category: 'personal' };
    },
  },
  {
    pattern: /i\s+(?:work(?:s|ed)?\s+(?:at|for|in))\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => ({ fact: `user works at ${m[1].trim()}`, entity: m[1].trim(), category: 'work' }),
  },
  {
    pattern: /i\s+(?:live\s+(?:in|at))\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => ({ fact: `user lives in ${m[1].trim()}`, entity: m[1].trim(), category: 'location' }),
  },
  {
    pattern: /i\s+(?:love|like|enjoy|prefer|adore)\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => ({ fact: `user likes ${m[1].trim()}`, entity: m[1].trim(), category: 'preference' }),
  },
  {
    pattern: /i\s+(?:hate|dislike|don't\s+like|cannot\s+stand)\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => ({ fact: `user dislikes ${m[1].trim()}`, entity: m[1].trim(), category: 'preference' }),
  },
  {
    pattern: /(.+?)\s+is\s+my\s+(\w+?)(?:\.|!|$)/i,
    extract: (m) => {
      const name = m[1].trim();
      const relation = m[2].toLowerCase();
      return { fact: `user's ${relation} is ${name}`, entity: name, category: 'relationship' };
    },
  },
  {
    pattern: /my\s+(\w+?)\s+'?s?\s+(?:name\s+)?is\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => {
      const relation = m[1].toLowerCase();
      const name = m[2].trim();
      return { fact: `user's ${relation} is named ${name}`, entity: name, category: 'relationship' };
    },
  },
  {
    pattern: /i\s+(?:have|'ve)\s+(?:a\s+)?(\w+)\s+(?:named|called)\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => ({ fact: `user has a ${m[1].toLowerCase()} named ${m[2].trim()}`, entity: m[2].trim(), category: 'personal' }),
  },
  {
    pattern: /i'm\s+(?:from|based\s+in)\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => ({ fact: `user is from ${m[1].trim()}`, entity: m[1].trim(), category: 'location' }),
  },
  {
    pattern: /i\s+study\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => ({ fact: `user studies ${m[1].trim()}`, entity: m[1].trim(), category: 'education' }),
  },
  {
    pattern: /my\s+(?:birthday|bday)\s+is\s+(.+?)(?:\.|!|$)/i,
    extract: (m) => ({ fact: `user's birthday is ${m[1].trim()}`, entity: m[1].trim(), category: 'personal' }),
  },
];

function categorizeField(field: string): string {
  const fieldLower = field.toLowerCase();
  if (/^(mom|mother|dad|father|brother|sister|parent|family|spouse|wife|husband|partner|son|daughter|cousin|uncle|aunt|grandparent|grandmother|grandfather)$/.test(fieldLower)) return 'relationship';
  if (/^(job|role|position|title|employer|company|boss)$/.test(fieldLower)) return 'work';
  if (/^(city|country|state|address|hometown|location)$/.test(fieldLower)) return 'location';
  if (/^(food|drink|color|music|movie|book|sport|hobby|game|show|song|artist|band)$/.test(fieldLower)) return 'preference';
  if (/^(school|university|college|degree|major)$/.test(fieldLower)) return 'education';
  return 'personal';
}

export function extractFacts(text: string): ExtractedFact[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const facts: ExtractedFact[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    for (const { pattern, extract } of PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        const fact = extract(match);
        if (fact && fact.entity && fact.entity.length > 0) {
          facts.push(fact);
          break;
        }
      }
    }
  }

  return facts;
}

export function extractFactOrRaw(text: string): ExtractedFact {
  const facts = extractFacts(text);
  if (facts.length > 0) return facts[0];
  return { fact: text.trim(), entity: null, category: 'general' };
}
