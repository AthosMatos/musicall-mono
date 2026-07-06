first pnpm i
make sure supabase server is on and running
then prisma generate on the api folder
then with the server running (pnpm dev on the api) run the following command to generate the types for the api package:

```bash
pnpm --filter api generate:api
```