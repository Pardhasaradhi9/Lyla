export interface KnowledgeResult {
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
}

export interface KnowledgeResponse {
  results: KnowledgeResult[];
  query: string;
  cached: boolean;
}
