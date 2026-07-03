import type { Hono } from "hono";


// ATXP: requirePayment only fires inside an ATXP context (set by atxpHono middleware).
// For raw x402 requests, the existing @x402/hono middleware handles the gate.
// If neither protocol is active (ATXP_CONNECTION unset), tryRequirePayment is a no-op.
async function tryRequirePayment(price: number): Promise<void> {
  if (!process.env.ATXP_CONNECTION) return;
  try {
    const { requirePayment } = await import("@atxp/server");
    const BigNumber = (await import("bignumber.js")).default;
    await requirePayment({ price: BigNumber(price) });
  } catch (e: any) {
    if (e?.code === -30402) throw e;
  }
}

// In-memory cache with TTL
interface CacheEntry {
  data: any[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

// Chain name normalization
const CHAIN_ALIASES: Record<string, string> = {
  base: "Base",
  ethereum: "Ethereum",
  eth: "Ethereum",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
  optimism: "Optimism",
  avalanche: "Avalanche",
  avax: "Avalanche",
  bsc: "BSC",
  binance: "BSC",
  solana: "Solana",
  fantom: "Fantom",
  gnosis: "Gnosis",
};

function normalizeChain(chain: string): string {
  return CHAIN_ALIASES[chain.toLowerCase()] || chain;
}

function getRiskLevel(tvl: number): "low" | "medium" | "high" {
  if (tvl >= 10_000_000) return "low";
  if (tvl >= 1_000_000) return "medium";
  return "high";
}

function formatTvl(tvl: number): string {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(2)}M`;
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(1)}K`;
  return `$${tvl.toFixed(0)}`;
}

async function fetchPools(): Promise<any[]> {
  const cacheKey = "defillama_pools";
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const resp = await fetch("https://yields.llama.fi/pools");
  if (!resp.ok) {
    throw new Error(`DeFiLlama API error: ${resp.status} ${resp.statusText}`);
  }

  const json = (await resp.json()) as { data: any[] };
  const pools = json.data || [];

  cache.set(cacheKey, { data: pools, timestamp: Date.now() });
  return pools;
}

export function registerRoutes(app: Hono) {
  async function handleYields(
    c: any,
    params: { token?: string; chain?: string; minTvl?: string; limit?: string }
  ) {
    await tryRequirePayment(0.002);
    const token = params.token;
    const chain = params.chain;
    const minTvlParam = params.minTvl;
    const limitParam = params.limit;

    if (!token) {
      return c.json({ error: "Missing required parameter: token (e.g. USDC, ETH, WBTC)" }, 400);
    }

    const tokenUpper = token.toUpperCase();
    const minTvl = minTvlParam ? parseFloat(minTvlParam) : 100_000;
    const limit = Math.min(Math.max(limitParam ? parseInt(limitParam, 10) : 10, 1), 50);
    const normalizedChain = chain ? normalizeChain(chain) : null;

    let pools: any[];
    try {
      pools = await fetchPools();
    } catch (err: any) {
      return c.json({ error: "Failed to fetch yield data", details: err.message }, 502);
    }

    // Filter pools
    let filtered = pools.filter((pool) => {
      // Match token in symbol (e.g. "USDC-WETH" contains "USDC")
      const symbol = (pool.symbol || "").toUpperCase();
      const tokens = symbol.split(/[-\/]/).map((t: string) => t.trim());
      if (!tokens.includes(tokenUpper)) return false;

      // Filter by chain
      if (normalizedChain && pool.chain !== normalizedChain) return false;

      // Filter by TVL
      if ((pool.tvlUsd || 0) < minTvl) return false;

      // Filter out pools with 0 or null APY
      if (!pool.apy || pool.apy <= 0) return false;

      // Filter out stale pools
      if (pool.stablecoin === false && pool.ilRisk === "yes" && pool.apy > 1000) return false;

      return true;
    });

    // Sort by APY descending
    filtered.sort((a, b) => (b.apy || 0) - (a.apy || 0));

    // Take top N
    const top = filtered.slice(0, limit);

    if (top.length === 0) {
      return c.json({
        token: tokenUpper,
        chain: normalizedChain || "all",
        results: 0,
        opportunities: [],
        message: `No yield opportunities found for ${tokenUpper}${normalizedChain ? ` on ${normalizedChain}` : ""}. Try a different token or remove the chain filter.`,
      });
    }

    const opportunities = top.map((pool) => ({
      protocol: pool.project || "Unknown",
      pool: pool.symbol || "Unknown",
      poolId: pool.pool,
      apy: parseFloat((pool.apy || 0).toFixed(2)),
      apyBase: pool.apyBase ? parseFloat(pool.apyBase.toFixed(2)) : null,
      apyReward: pool.apyReward ? parseFloat(pool.apyReward.toFixed(2)) : null,
      tvl: pool.tvlUsd || 0,
      tvlFormatted: formatTvl(pool.tvlUsd || 0),
      chain: pool.chain,
      risk: getRiskLevel(pool.tvlUsd || 0),
      rewardTokens: pool.rewardTokens || [],
      stablecoin: pool.stablecoin || false,
      ilRisk: pool.ilRisk || "no",
      exposure: pool.exposure || "single",
      poolMeta: pool.poolMeta || null,
    }));

    return c.json({
      token: tokenUpper,
      chain: normalizedChain || "all",
      results: opportunities.length,
      totalPoolsScanned: pools.length,
      minTvlFilter: minTvl,
      cachedUntil: new Date(Date.now() + CACHE_TTL).toISOString(),
      opportunities,
    });
  }

  app.get("/api/yields", async (c) => {
    return handleYields(c, {
      token: c.req.query("token"),
      chain: c.req.query("chain"),
      minTvl: c.req.query("minTvl"),
      limit: c.req.query("limit"),
    });
  });

  // POST mirror of the GET route above -- Bazaar (CDP) only reliably indexes
  // POST payments with valid payloads (~82% conversion vs ~14% for GET-only
  // resources, confirmed empirically). Same params, same logic, just body
  // instead of query string.
  app.post("/api/yields", async (c) => {
    const body = await c.req.json().catch(() => ({}) as any);
    return handleYields(c, {
      token: body.token,
      chain: body.chain,
      minTvl: body.minTvl !== undefined ? String(body.minTvl) : undefined,
      limit: body.limit !== undefined ? String(body.limit) : undefined,
    });
  });
}
