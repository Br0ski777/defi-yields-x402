import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "defi-yields",
  slug: "defi-yields",
  description: "Find the best DeFi yields for any token across protocols and chains.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/yields",
      price: "$0.002",
      description: "Find best DeFi yield opportunities for a token",
      toolName: "defi_find_best_yields",
      toolDescription: "Use this when you need to find the best DeFi yields for a token. Returns top lending/staking/LP opportunities ranked by APY, with protocol name, chain, TVL, and risk level. Powered by DeFiLlama. Ideal for yield optimization, idle capital deployment, DeFi strategy comparison. Do NOT use for swap quotes — use dex_get_swap_quote. Do NOT use for wallet balance — use wallet_get_portfolio.",
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
    },
  ],
};
