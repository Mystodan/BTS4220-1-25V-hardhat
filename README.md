# Eksamensinnlevering Web3-basert Todo-app i Solidity, Ethereum, Hardhat, React
Av: Daniel Hao Huynh 276562, og Mikael Fossli 247048

## Funkjsonelle Krav:
- id; Vi bruker da UUID i vår Todo Dapp som er klart bedre enn id, spesielt i en web3/blockchain-kontekst hvor desentralisering, global unikhet og sikkerhet er viktig. Det gir også bedre brukeropplevelse og enklere vedlikehold av kodebasen.
  - Global unikhet
  - Desentralisert generering
  - Ingen behov for id-teller på blockchain
  - Ingen risiko for kollisjon eller gjenbruk
  - Bedre sikkerhet og anonymitet
  - Bedre brukeropplevelse (optimistic UI)
  - Skalerbarhet på tvers av systemer og kontrakter
- description; Vi har da bare implementert en allminnelig string som lagrer innholdene til Taskene.
- createdAt; Taskene lagrer da datoen og tidsstempel på når de ble opprettet.
- completed; en Boolean som definerer om Tasken er ferdig eller ikke.
- completedAt; dynamisk variabel som lagrer stempel på når en task ble ferdig, endrer seg hver gang completed blir togglet.
- user; eieren av tasken, kun brukeren kan endre på tasken og slette den, men alle kan markere den som ferdig.
- private; om tasken er synlig for andre enn eieren.

## Teknologi-stack & Verktøy

- Solidity (Skriving av smarte kontrakter og tester)
- Javascript (React & Testing)
- [Hardhat](https://hardhat.org/) (Utviklingsrammeverk)
- [Ethers.js](https://docs.ethers.io/v5/) (Blockchain-interaksjon)
- [React.js](https://reactjs.org/) (Frontend-rammeverk)

## Krav for første oppsett
- Installer [NodeJS](https://nodejs.org/en/)

## Oppsett
### 1. Klon/last ned repoet

### 2. Installer avhengigheter:
`$ npm install`

### 3. Kjør tester
`$ npx hardhat test`

### 4. Start Hardhat-node
`$ npx hardhat node`

### 5. Kjør deploy-script
I et eget terminalvindu, kjør:
`$ npx hardhat run ./scripts/deploy.js --network localhost`

### 7. Start frontend
`$ npm run start`

### Takk til
Stor takk til skaperen av malen – [Akash Singhal](https://akashsinghal.simple.ink/) [Dapp University](https://www.dappuniversity.com/) og [Gregory](https://www.twitter.com/DappUniversity)!
