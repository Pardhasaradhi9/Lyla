import * as Contacts from 'expo-contacts';

export async function ensureContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

export async function lookupContact(name: string): Promise<string> {
  const granted = await ensureContactsPermission();
  if (!granted) return 'Contacts permission not granted. Please enable it in Settings.';

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Birthday],
  });

  if (!data || data.length === 0) return 'No contacts found on this device.';

  const nameLower = name.toLowerCase();
  const matches = data.filter(c => {
    const fullName = `${c.firstName || ''} ${c.middleName || ''} ${c.lastName || ''}`.toLowerCase().trim();
    return fullName.includes(nameLower) || (c.name && c.name.toLowerCase().includes(nameLower));
  });

  if (matches.length === 0) return `No contact found matching "${name}".`;

  const results = matches.slice(0, 3).map(c => {
    const parts: string[] = [];
    const fullName = [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ') || c.name || 'Unknown';

    const phone = c.phoneNumbers?.[0]?.number;
    if (phone) parts.push(`Phone: ${phone}`);

    const email = c.emails?.[0]?.email;
    if (email) parts.push(`Email: ${email}`);

    if (c.birthday) {
      const bday = c.birthday;
      const bdayStr = `${bday.month}/${bday.day}${bday.year ? `/${bday.year}` : ''}`;
      parts.push(`Birthday: ${bdayStr}`);
    }

    return `${fullName}: ${parts.join(', ') || 'no details available'}`;
  });

  return results.join('\n');
}
