# PurpleMusicApp

## Deploy / Struktura

Frontend (React) i backend (Express) su u istom repozitorijumu:

```
root/
	backend/          # Express API (Render)
	src/              # React source (Netlify ili lokalni build)
	public/
```

`build/` folder se NE commituje više (ignorisan u `.gitignore`). Generiše se dinamički:

```
npm run build   # kreira build/ lokalno
```

## Render backend
Build command (ako je service root repo):
```
npm install
```
Start command:
```
node backend/server.js
```

Potrebne env varijable (Render > Environment):
```
SUPABASE_SERVICE_KEY=<service_role_key>
PI_API_KEY=<pi_server_api_key>
```

## Pi Payments Flow
Koristimo approve / complete pattern:
1. Pi SDK -> onReadyForServerApproval -> POST /api/payments/approve
2. Pi SDK -> onReadyForServerCompletion (paymentId, txid) -> POST /api/payments/complete
3. Backend validira i postavlja `is_premium=true` u Supabase.

## Razlog uklanjanja build foldera
Smanjuje veličinu repozitorijuma i ubrzava Render kloniranje / deploy.

---

## Netlify (Frontend) Deploy Koraci

1. Napravi novi Netlify site: "Add new site" -> Import from Git -> izaberi ovaj repo.
2. Build command: `npm run build`
3. Publish directory: `build`
4. Node verzija: 18 (podešeno u `netlify.toml`)
5. Environment vars (Netlify UI > Site settings > Environment):
	- `REACT_APP_API_URL` = URL backend servisa na Render-u (npr. https://purplemusic-backend.onrender.com)
	- (Opcionalno) `SUPABASE_URL` & `SUPABASE_ANON_KEY` ako želiš override (u kodu su hardcodovani, pa možeš ostaviti prazno)
6. Deploy. Nakon prvog backend deploy-a ažuriraj REACT_APP_API_URL ako se promeni.

### Lokálni dev (frontend):
```
npm install
npm start
```
Backend külön: `npm run start:backend`

## Render (Backend) Deploy preko render.yaml

Opcija A (automatski): U Render dashboard-u "New +" -> "Blueprint" -> pokaži repo -> Render prepozna `render.yaml` -> Deploy.

Opcija B (manual):
1. New Web Service
2. Root directory = repo root
3. Build Command: `npm install && npm run install:backend`
4. Start Command: `node backend/server.js`
5. Environment vars:
	- `SUPABASE_SERVICE_KEY` (service_role ključ – ČUVAJ TAJNO)
	- `PI_API_KEY` (Pi server API ključ)
	- (Opcionalno) `NODE_VERSION` = 18.20.2

## Environment Pregled

Frontend (public build): koristi samo `REACT_APP_*` promenljive. Service key NIKAD ne stavljati u frontend.

Backend: koristi `SUPABASE_SERVICE_KEY` + `PI_API_KEY` (process.env...).

## Struktura Scripts

`package.json` (root):
```
start           -> React dev server
start:backend   -> Express backend
build           -> Frontend production build (Netlify)
install:backend -> Install dependencies for /backend
postinstall     -> Automatski instalira backend deps posle root npm install
```

## Česte Greške

1. 404 na API pozive sa frontenda -> proveri `REACT_APP_API_URL` na Netlify-u.
2. CORS error -> backend cors() default dozvoljava sve; ako dodaš restrikcije, dodaj Netlify domen.
3. Pi payments ne aktivira premium -> proveri backend logs + da li je `PI_API_KEY` validan i payment status `completed`.
4. Supabase update error -> fali `SUPABASE_SERVICE_KEY` ili tabela `users` nema kolonu `pi_user_uid` / `is_premium`.

## Lokalni Full Dev (paralelno)

Opcija egyszerű (két terminal):
```
npm run start:backend
npm start
```

## Security Napomene

- `SUPABASE_SERVICE_KEY` NIKADA ne commit-ovati (samo env u Render-u)
- `PI_API_KEY` isto.
- Anon key je javni i može biti commitovan (nije tajna).

## Sledeći Koraci / TODO (opciono)

- Dodati health endpoint za backend: `/healthz` (trenutno root poruka postoji)
- Dodati rate limiting za payment rute (express-rate-limit)
- Monitoring (pino logger + Logflare / betterstack)
