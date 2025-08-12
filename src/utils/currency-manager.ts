import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".config", "calc");
const OLD_CONFIG_DIR = join(homedir(), ".config", "boomi");
const CURRENCY_FILE = join(CONFIG_DIR, "currencies.json");
const OLD_CURRENCY_FILE = join(OLD_CONFIG_DIR, "currencies.json");
const CURRENCY_API_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CurrencyData {
  date: string;
  usd: Record<string, number>;
  lastUpdated: number;
}

export class CurrencyManager {
  private static instance: CurrencyManager;
  private currencyRates: Record<string, number> = {};
  private disabled = false;
  private disabledReason: string | null = null;
  private stale = false; // using cached data but update failed

  private constructor() {}

  static getInstance(): CurrencyManager {
    if (!CurrencyManager.instance) {
      CurrencyManager.instance = new CurrencyManager();
    }
    return CurrencyManager.instance;
  }

  async initialize(): Promise<void> {
    // Ensure config directory exists
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Load existing currency data (prefer new path, fallback to legacy)
    this.loadCurrencyData();

    // Check if we need to update
    if (this.shouldUpdate()) {
      await this.updateCurrencyData();
    }
  }

  private loadCurrencyData(): void {
    try {
      let fileToRead: string | null = null;
      if (existsSync(CURRENCY_FILE)) {
        fileToRead = CURRENCY_FILE;
      } else if (existsSync(OLD_CURRENCY_FILE)) {
        fileToRead = OLD_CURRENCY_FILE;
      }

      if (fileToRead) {
        const content = readFileSync(fileToRead, "utf-8");
        const data: CurrencyData = JSON.parse(content);

        // Convert to our internal format (uppercase keys)
        this.currencyRates = {};
        for (const [currency, rate] of Object.entries(data.usd)) {
          this.currencyRates[currency.toUpperCase()] = rate;
        }
      }
    } catch (error) {
      console.error("Failed to load currency data:", error);
    }
  }

  private shouldUpdate(): boolean {
    // Prefer new file; if missing, check legacy file timestamp
    let fileForStaleness: string | null = null;
    if (existsSync(CURRENCY_FILE)) {
      fileForStaleness = CURRENCY_FILE;
    } else if (existsSync(OLD_CURRENCY_FILE)) {
      fileForStaleness = OLD_CURRENCY_FILE;
    }

    if (!fileForStaleness) {
      return true;
    }

    try {
      const stats = statSync(fileForStaleness);
      const lastModified = stats.mtime.getTime();
      const now = Date.now();

      // Update if file is older than 24 hours
      return now - lastModified > UPDATE_INTERVAL;
    } catch {
      return true;
    }
  }

  async updateCurrencyData(): Promise<void> {
    try {
      console.log("Updating currency exchange rates...");

      const response = await fetch(CURRENCY_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
        date: string;
        usd: Record<string, number>;
      };

      // Add metadata
      const currencyData: CurrencyData = {
        date: data.date,
        usd: data.usd,
        lastUpdated: Date.now(),
      };

      // Save to file (new location)
      writeFileSync(CURRENCY_FILE, JSON.stringify(currencyData, null, 2));

      // Update internal rates
      this.currencyRates = {};
      for (const [currency, rate] of Object.entries(
        data.usd as Record<string, number>
      )) {
        this.currencyRates[currency.toUpperCase()] = rate;
      }

      // Reset state flags
      this.disabled = false;
      this.disabledReason = null;
      this.stale = false;

      console.log(
        `Currency rates updated successfully. Found ${Object.keys(this.currencyRates).length} currencies.`
      );
    } catch (error) {
      console.error("Failed to update currency data:", error);

      // If we already have some rates loaded (from cache), keep them and mark as stale
      if (Object.keys(this.currencyRates).length > 0) {
        this.stale = true;
        this.disabled = false;
        this.disabledReason = null;
        return;
      }

      // No cache available: disable currency conversions
      this.disabled = true;
      this.disabledReason =
        "Unable to download currency data and no cache available";
      this.currencyRates = {};
    }
  }

  getRates(): Record<string, number> {
    return this.currencyRates;
  }

  getRate(currency: string): number | undefined {
    const rates = this.getRates();
    return rates[currency.toUpperCase()];
  }

  getAvailableCurrencies(): string[] {
    return Object.keys(this.currencyRates);
  }

  isEnabled(): boolean {
    return !this.disabled;
  }

  isStale(): boolean {
    return this.stale;
  }

  getDisabledReason(): string | null {
    return this.disabled
      ? (this.disabledReason ?? "Currency support disabled")
      : null;
  }

  // Basic currency code detection independent of live rates
  isKnownCurrencyCode(code: string): boolean {
    if (!code) {
      return false;
    }
    const upper = code.toUpperCase();
    if (this.currencyRates[upper] !== undefined) {
      return true;
    }
    // Common ISO 4217 codes for offline detection
    const common = new Set([
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "CHF",
      "CNY",
      "INR",
      "KRW",
      "SEK",
      "NOK",
      "DKK",
      "PLN",
      "CZK",
      "HUF",
      "RON",
      "BGN",
      "HRK",
      "RUB",
      "TRY",
      "BRL",
      "MXN",
      "ZAR",
      "HKD",
      "SGD",
      "NZD",
    ]);
    return common.has(upper);
  }
}
