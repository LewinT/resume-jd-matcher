# Resume ↔ Job Matcher

A small Next.js MVP that compares a PDF resume with a Job Description. OpenAI performs structured extraction and conservative semantic comparison; application code calculates the score and evidence-grounded suggestions deterministically.

## Local setup

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root with server-only values:

```text
OPENAI_API_KEY=your_openai_api_key
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
RATE_LIMIT_IP_SALT=a_long_random_secret_value
```

Generate a new salt locally in PowerShell with:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Never prefix these names with `NEXT_PUBLIC_`; they must stay on the server. Then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cost controls

- PDF extraction: 10 requests per hour per pseudonymous client.
- `/api/analyze` and `/api/match`: one shared allowance of 6 paid calls per hour per pseudonymous client.
- All paid calls: one shared global allowance of 40 per day.
- If Upstash cannot verify a paid allowance, the request stops before OpenAI.
- **Try Example** renders fictional local data and uses no API route.

## Validation

```bash
npm run test:scoring
npm run test:suggestions
npm run test:day6
npm run lint
npm run build
```

Deployment is intentionally not part of the current milestone.
