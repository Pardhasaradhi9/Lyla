import { KnowledgeResult } from '../types';

const BASE = 'https://openlibrary.org';

export async function searchBooks(query: string): Promise<KnowledgeResult[]> {
  try {
    const url = `${BASE}/search.json?q=${encodeURIComponent(query)}&limit=3&fields=title,author_name,first_publish_year,subject,isbn,number_of_pages_median,publisher`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Lyla/0.1.0 (private on-device AI)' },
    });
    if (!res.ok) return [];
    const data = await res.json();

    if (!data.docs || data.docs.length === 0) return [];

    return data.docs.map((book: any) => {
      const parts: string[] = [];
      if (book.author_name) parts.push(`by ${book.author_name.slice(0, 3).join(', ')}`);
      if (book.first_publish_year) parts.push(`Published: ${book.first_publish_year}`);
      if (book.number_of_pages_median) parts.push(`${book.number_of_pages_median} pages`);
      if (book.publisher) parts.push(`Publisher: ${book.publisher[0]}`);

      return {
        title: book.title ?? 'Unknown',
        content: parts.join('\n'),
        source: 'OpenLibrary',
        sourceUrl: book.isbn ? `${BASE}/isbn/${book.isbn[0]}` : `${BASE}/search?q=${encodeURIComponent(book.title ?? '')}`,
      };
    });
  } catch {
    return [];
  }
}
