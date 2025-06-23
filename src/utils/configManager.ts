import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse, stringify } from 'yaml';

const CONFIG_DIR = join(homedir(), '.config', 'boomi');
const CONFIG_FILE = join(CONFIG_DIR, 'config.yaml');

interface Config {
  precision: number;
  // Add more options here in the future
}

const DEFAULT_CONFIG: Config = {
  precision: 2
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config = DEFAULT_CONFIG;
  
  private constructor() {}
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  async initialize(): Promise<void> {
    // Ensure config directory exists
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    // Load or create config
    if (existsSync(CONFIG_FILE)) {
      await this.loadConfig();
    } else {
      await this.saveConfig();
    }
  }
  
  private async loadConfig(): Promise<void> {
    try {
      const content = readFileSync(CONFIG_FILE, 'utf-8');
      const loadedConfig = parse(content) as Partial<Config>;
      
      // Merge with defaults to ensure all fields exist
      this.config = {
        ...DEFAULT_CONFIG,
        ...loadedConfig
      };
      
      // Validate config values
      this.validateConfig();
    } catch (error) {
      console.error('Failed to load config, using defaults:', error);
      this.config = DEFAULT_CONFIG;
    }
  }
  
  private async saveConfig(): Promise<void> {
    try {
      const yamlContent = '# Boosted Calculator Configuration\n' +
                         '# precision: Number of decimal places for results (default: 2)\n' +
                         '\n' +
                         stringify(this.config);
      
      writeFileSync(CONFIG_FILE, yamlContent);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }
  
  private validateConfig(): void {
    // Validate precision
    if (typeof this.config.precision !== 'number' || 
        this.config.precision < 0 || 
        this.config.precision > 20) {
      console.warn(`Invalid precision value: ${this.config.precision}, using default: ${DEFAULT_CONFIG.precision}`);
      this.config.precision = DEFAULT_CONFIG.precision;
    }
  }
  
  get precision(): number {
    return this.config.precision;
  }
  
  async setPrecision(precision: number): Promise<void> {
    this.config.precision = Math.max(0, Math.min(20, Math.floor(precision)));
    await this.saveConfig();
  }
  
  getConfig(): Config {
    return { ...this.config };
  }
}