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