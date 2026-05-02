# Free, Open-Source, Commercially Usable APIs
### No API Key Required — Mobile (iOS/Android) Compatible

> All "No key" entries work directly from iOS/Android via your backend relay — no secrets exposed on device.  
> "Free key" entries require account signup but cost nothing and can be stored server-side.

---

## 1. Knowledge & Encyclopedic

| API | Description | Key Required | License | Commercial Use |
|-----|-------------|:---:|---------|:---:|
| **Wikipedia API** | Full article text, summaries, search, linked articles. The anchor of any knowledge bundle. | No | CC BY-SA | ✅ |
| **Wikidata** | 120M+ structured entities. Machine-readable facts as triplets. CC0 — no restrictions at all. | No | CC0 | ✅ |
| **DBpedia** | Structured data extracted from Wikipedia. SPARQL endpoint. Good for entity linking. | No | CC BY-SA | ✅ |
| **DuckDuckGo Instant Answer** | Topic summaries, definitions, disambiguation. Mostly wraps Wikipedia. Limited for niche queries. | No | Non-commercial intent | ⚠️ |

### Notes
- **Wikidata** has the cleanest license in this entire list — CC0 means zero restrictions, including AI training and RAG systems.
- **DuckDuckGo** is ambiguous on commercial use — it's designed for individual user queries, not high-volume backend calls.

---

## 2. Academic & Research Literature

| API | Description | Key Required | License | Commercial Use |
|-----|-------------|:---:|---------|:---:|
| **OpenAlex** | 250M+ scholarly works, authors, institutions. 100K calls/day. Replaces Scopus ($10K/yr). | No | CC0 | ✅ |
| **arXiv API** | Preprints in CS, ML, physics, math, biology. Free metadata + abstracts. | No | Open access | ✅ |
| **PubMed E-utilities** | 40M+ biomedical papers via NCBI. Essential for health queries. | No | Public domain | ✅ |
| **Semantic Scholar** | 200M+ papers with citation graph and AI-extracted concepts. | Free key | Open | ✅ |
| **Crossref** | 150M+ DOI metadata. Publisher of record for citations. Polite pool with email param. | No | CC0 | ✅ |
| **OpenLibrary (Internet Archive)** | Books, authors, ISBNs. 1 req/sec default. Not for bulk use. | No | Fair use only | ⚠️ |

### Notes
- **OpenAlex** is the standout — no key, 100K calls/day, CC0 license. Replaces expensive commercial databases.
- **OpenLibrary** explicitly states it's not for high-traffic commercial infrastructure. Fine for per-user lookups only.
- Add your email as a URL param to OpenAlex and Crossref to get into the "polite pool" (faster, more consistent responses).

---

## 3. Language & Dictionary

| API | Description | Key Required | License | Commercial Use |
|-----|-------------|:---:|---------|:---:|
| **Free Dictionary API** | Definitions, phonetics, examples, synonyms. JSON. Works great on mobile. | No | Open | ✅ |
| **Datamuse API** | Words that rhyme, relate, sound like, mean. Generous limits. Good for writing tools. | No | Open | ✅ |
| **Wiktionary API** | Definitions in 170+ languages via MediaWiki. Same infrastructure as Wikipedia. | No | CC BY-SA | ✅ |

---

## 4. Weather & Environment

| API | Description | Key Required | License | Commercial Use |
|-----|-------------|:---:|---------|:---:|
| **Open-Meteo** | Forecast, historical, air quality. Truly free forever. Commercial plan exists but free tier covers most apps. | No | Open | ✅ |
| **OpenWeatherMap (free)** | 60 calls/min free tier. Wide coverage. Requires free key. | Free key | Proprietary | ✅ |

---

## 5. Geography & Location

| API | Description | Key Required | License | Commercial Use |
|-----|-------------|:---:|---------|:---:|
| **REST Countries** | Country data — capitals, currencies, languages, flags, calling codes. No key, no limits. | No | Open | ✅ |
| **Nominatim (OpenStreetMap)** | Geocoding and reverse geocoding. 1 req/sec limit. Must set User-Agent. | No | ODbL | ✅ |
| **GeoNames** | 5M+ place names, postcodes, timezones. Free account gives 30K credits/day. Very reliable. | Free key | CC BY | ✅ |
| **ip-api** | IP to country/city/timezone. 45 req/min free, no key. Good for locale-aware responses. | No | Non-commercial free | ⚠️ |

### Notes
- **ip-api** free tier is non-commercial. Their Pro plan ($15/mo) unlocks commercial use if needed.
- **Nominatim** requires a proper `User-Agent` header with your app name and contact info — otherwise requests may be blocked.

---

## 6. Finance & Economics

| API | Description | Key Required | License | Commercial Use |
|-----|-------------|:---:|---------|:---:|
| **World Bank API** | GDP, poverty, education, health indicators for 200+ countries. CC BY 4.0. | No | CC BY 4.0 | ✅ |
| **FRED (St. Louis Fed)** | 800K+ US economic time series — inflation, employment, interest rates, GDP. | Free key | Public domain | ✅ |
| **Currency-API (fawazahmed0)** | 150+ currency conversions updated daily. No key, no rate limit. GitHub-hosted — very stable. | No | MIT | ✅ |
| **ExchangeRate-API (free)** | 1,500 req/month free. Good fallback if Currency-API misses a pair. | Free key | Proprietary | ✅ |

---

## 7. Science & Space

| API | Description | Key Required | License | Commercial Use |
|-----|-------------|:---:|---------|:---:|
| **NASA APIs (20+)** | APOD, Mars Rover photos, Earth imagery, asteroid data. Very generous limits. | Free key | Public domain | ✅ |
| **Open Notify** | ISS real-time location and pass times. No key. Good for STEM / science apps. | No | Open | ✅ |
| **USGS Earthquake API** | Real-time and historical earthquake data globally. JSON. USGS public domain. | No | Public domain | ✅ |

---

## 8. Health & Medicine

| API | Description | Key Required | License | Commercial Use |
|-----|-------------|:---:|---------|:---:|
| **OpenFDA** | Drug labels, adverse events, recalls, device data from the US FDA. Generous limits. | No | Public domain | ✅ |
| **Open Disease Data (disease.sh)** | Global disease statistics (COVID historical, flu). MIT licensed. | No | MIT | ✅ |

---

## 9. Utilities & Misc

| API | Description | Key Required | License | Commercial Use |
|-----|-------------|:---:|---------|:---:|
| **NumbersAPI** | Math, trivia, date facts for any number. Good for onboarding or fun facts. | No | Open | ✅ |
| **Public Holiday API** | Public holidays for 100+ countries. Great for calendar and scheduling features. | No | Open | ✅ |
| **Open Trivia DB** | Questions across 24 categories. MIT. Useful for gamified learning features. | No | MIT | ✅ |
| **PokeAPI** | Complete Pokémon data. Mentioned because it's the gold standard for API design patterns — worth studying. | No | Open | ✅ |

---

## Mobile Architecture Note

iOS and Android **cannot run MCP servers or local API processes** due to sandboxing.  
The correct pattern for all of the above:

```
Mobile App (iOS/Android)
        │
        │  HTTP/REST call
        ▼
Your Backend (Express on Render)
        │
        │  Calls to external APIs
        ▼
Wikipedia / OpenAlex / Open-Meteo / etc.
```

Your mobile app never talks to these APIs directly. It calls your own backend, which acts as a relay. This also means:
- No API keys ever touch the device
- You can cache responses server-side to reduce API calls
- You can apply rate limiting and query classification at the backend layer

---

## Recommended Bundle for PrepMyRez Mobile

| Use Case | Recommended API |
|----------|----------------|
| Career knowledge, company profiles, skill definitions | Wikipedia + Wikidata |
| Research papers, skill-building resources | OpenAlex + arXiv |
| Terminology explanations | Free Dictionary API |
| Location-aware features | REST Countries + GeoNames |
| Labor market context by country | World Bank API |
| Currency (for international salary comparisons) | Currency-API |

This bundle covers ~90% of what Career Compass users would ask — with zero paid API calls.

---

## Query Routing Architecture

Route queries before hitting any external source to preserve rate limits:

```
User Query → Intent Classifier (local LLM)
  ├── Factual / definitional     → Wikipedia or Wikidata
  ├── Scientific / research      → OpenAlex or arXiv or PubMed
  ├── Geographic / country       → REST Countries or GeoNames
  ├── Weather                    → Open-Meteo
  ├── Economic / financial       → World Bank or FRED
  ├── Health / medical           → OpenFDA or PubMed
  ├── Recent / news / current    → Brave Search (rate-limited fallback)
  └── Unknown                    → Wikipedia first, Brave only if empty
```

---

*Last verified: May 2026 | Sources: public-apis/public-apis, OpenAlex docs, Wikimedia Enterprise, IntuitionLabs research API review*
