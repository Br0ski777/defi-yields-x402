# DeFi Yield Finder API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://defi-yields.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Best DeFi yields ranked by APY -- lending, staking, LP across 100+ protocols. Powered by DeFiLlama. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "defi-yields": {
      "url": "https://defi-yields.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl "https://defi-yields.api.klymax402.com/api/yields?token=..."
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `defi_find_best_yields` | GET | `/api/yields` | $0.002 | Find best DeFi yield opportunities for a token |

### `defi_find_best_yields`

Use this when you need to find the best DeFi yields for a token across all chains and protocols. Returns ranked opportunities in JSON.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `token` | string | yes | Token symbol to find yields for (e.g. USDC, ETH, WBTC) |
| `chain` | string | no | Filter by chain (e.g. base, ethereum, arbitrum, polygon). Optional — returns all chains if omitted. |
| `minTvl` | number | no | Minimum TVL in USD to filter pools (default: 100000) |
| `limit` | number | no | Number of results to return (default: 10, max: 50) |

**Returns**

- `pool` -- pool/vault name and pair
- `protocol` -- protocol name (Aave, Compound, Lido, Aerodrome, etc.)
- `chain` -- which blockchain network
- `apy` -- current annual percentage yield
- `tvl` -- total value locked in USD
- `riskLevel` -- risk assessment (low/medium/high)
- `type` -- yield type (lending, staking, LP, vault)

Example response:

```json
{"pools":[{"pool":"USDC Lending","protocol":"Aave V3","chain":"base","apy":4.82,"tvl":125000000,"riskLevel":"low","type":"lending"}],"token":"USDC","totalPools":15}
```

**When to use**: deploying idle capital to find the highest safe yield. Essential for yield optimization and DeFi strategy comparison.

**Not for**: swap quotes (use `dex_get_swap_quote`), wallet balance (use `wallet_get_portfolio`), liquidation risk (use `defi_get_liquidation_levels`).

## Example agent prompts

- "Find the best DeFi yields for a token across all chains and protocols"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
