import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "defi-yields",
  slug: "defi-yields",
  description: "Best DeFi yields ranked by APY -- lending, staking, LP across 100+ protocols. Powered by DeFiLlama.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/yields",
      price: "$0.002",
      description: "Find best DeFi yield opportunities for a token",
      toolName: "defi_find_best_yields",
      toolDescription: `Use this when you need to find the best DeFi yields for a token across all chains and protocols. Returns ranked opportunities in JSON.

1. pool: pool/vault name and pair
2. protocol: protocol name (Aave, Compound, Lido, Aerodrome, etc.)
3. chain: which blockchain network
4. apy: current annual percentage yield
5. tvl: total value locked in USD
6. riskLevel: risk assessment (low/medium/high)
7. type: yield type (lending, staking, LP, vault)

Example output: {"pools":[{"pool":"USDC Lending","protocol":"Aave V3","chain":"base","apy":4.82,"tvl":125000000,"riskLevel":"low","type":"lending"}],"token":"USDC","totalPools":15}

Use this BEFORE deploying idle capital to find the highest safe yield. Essential for yield optimization and DeFi strategy comparison.

Do NOT use for swap quotes -- use dex_get_swap_quote instead. Do NOT use for wallet balance -- use wallet_get_portfolio instead. Do NOT use for Base-only yields -- use base_get_defi_opportunities instead. Do NOT use for liquidation risk -- use defi_get_liquidation_levels instead.`,
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string", description: "Token symbol to find yields for (e.g. USDC, ETH, WBTC)" },
          chain: {
            type: "string",
            description: "Filter by chain (e.g. base, ethereum, arbitrum, polygon). Optional — returns all chains if omitted.",
          },
          minTvl: {
            type: "number",
            description: "Minimum TVL in USD to filter pools (default: 100000)",
          },
          limit: {
            type: "number",
            description: "Number of results to return (default: 10, max: 50)",
          },
        },
        required: ["token"],
      },
      outputSchema: {
          "type": "object",
          "properties": {
            "token": {
              "type": "string",
              "description": "Token queried"
            },
            "chain": {
              "type": "string",
              "description": "Chain filter"
            },
            "results": {
              "type": "number",
              "description": "Number of opportunities"
            },
            "opportunities": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "protocol": {
                    "type": "string"
                  },
                  "pool": {
                    "type": "string"
                  },
                  "apy": {
                    "type": "number"
                  },
                  "apyBase": {
                    "type": "number"
                  },
                  "apyReward": {
                    "type": "number"
                  },
                  "tvl": {
                    "type": "number"
                  },
                  "tvlFormatted": {
                    "type": "string"
                  },
                  "chain": {
                    "type": "string"
                  },
                  "risk": {
                    "type": "string"
                  }
                }
              }
            }
          },
          "required": [
            "token",
            "results",
            "opportunities"
          ]
        },
    },
  ],
};
