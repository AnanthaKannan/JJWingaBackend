## To run single file
```
npx playwright test api.spec.ts
```

## API test configuration
Start the API before running the suite. The tests default to:

```
E2E_BASE_URL=http://127.0.0.1:3000
E2E_ADMIN_USERNAME=AHB100
E2E_ADMIN_PASSWORD=Teacher100
E2E_DEVICE_ID=playwright-device
```

Set `E2E_API_KEY` to also exercise the valid cron API-key path.

## Run single test by name
```
npx playwright test -g "Login API"
```

## Run in UI mode
```
npx playwright test --ui
```

## Generate all html reports
```
npx playwright show-report
```
