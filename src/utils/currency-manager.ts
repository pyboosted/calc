import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".config", "boomi");
const CURRENCY_FILE = join(CONFIG_DIR, "currencies.json");
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

    // Load existing currency data
    this.loadCurrencyData();

    // Check if we need to update
    if (this.shouldUpdate()) {
      await this.updateCurrencyData();
    }
  }

  private loadCurrencyData(): void {
    try {
      if (existsSync(CURRENCY_FILE)) {
        const content = readFileSync(CURRENCY_FILE, "utf-8");
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
    if (!existsSync(CURRENCY_FILE)) {
      return true;
    }

    try {
      const stats = statSync(CURRENCY_FILE);
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

      // Save to file
      writeFileSync(CURRENCY_FILE, JSON.stringify(currencyData, null, 2));

      // Update internal rates
      this.currencyRates = {};
      for (const [currency, rate] of Object.entries(
        data.usd as Record<string, number>
      )) {
        this.currencyRates[currency.toUpperCase()] = rate;
      }

      console.log(
        `Currency rates updated successfully. Found ${Object.keys(this.currencyRates).length} currencies.`
      );
    } catch (error) {
      console.error("Failed to update currency data:", error);

      // Fall back to hardcoded rates if update fails
      this.currencyRates = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
        INR: 74.5,
        KRW: 1180.0,
      };
    }
  }

  getRates(): Record<string, number> {
    // If we have no rates, return default ones
    if (Object.keys(this.currencyRates).length === 0) {
      return {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
        INR: 74.5,
        KRW: 1180.0,
      };
    }

    return this.currencyRates;
  }

  getRate(currency: string): number | undefined {
    return this.currencyRates[currency.toUpperCase()];
  }
}
