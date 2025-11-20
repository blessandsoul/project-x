import { FastifyInstance } from 'fastify';
import axios, { type AxiosError } from 'axios';

interface ExchangeRateApiResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  conversion_rates: Record<string, number>;
}

export class FxRateService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  private get todayUtcDate(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async getRateForDate(
    baseCurrency: string,
    targetCurrency: string,
    rateDate: string,
  ): Promise<number | null> {
    const anyFastify: any = this.fastify as any;
    const db = anyFastify.mysql;

    if (!db || typeof db.execute !== 'function') {
      this.fastify.log.error('MySQL pool is not available on fastify instance');
      return null;
    }

    const [rows] = (await db.execute(
      'SELECT rate FROM exchange_rates WHERE base_currency = ? AND target_currency = ? AND rate_date = ? LIMIT 1',
      [baseCurrency, targetCurrency, rateDate],
    )) as any[];

    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as { rate: number };
      return typeof row.rate === 'number' ? row.rate : Number(row.rate);
    }

    return null;
  }

  private async upsertRate(
    baseCurrency: string,
    targetCurrency: string,
    rate: number,
    rateDate: string,
  ): Promise<void> {
    const anyFastify: any = this.fastify as any;
    const db = anyFastify.mysql;

    if (!db || typeof db.execute !== 'function') {
      this.fastify.log.error('MySQL pool is not available on fastify instance');
      return;
    }

    await db.execute(
      `INSERT INTO exchange_rates (base_currency, target_currency, rate, rate_date)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rate = VALUES(rate),
         updated_at = CURRENT_TIMESTAMP`,
      [baseCurrency, targetCurrency, rate, rateDate],
    );
  }

  private async fetchUsdToGelRateFromApi(): Promise<number | null> {
    const apiKey = process.env.EXCHANGE_API_KEY;
    if (!apiKey) {
      this.fastify.log.error('EXCHANGE_API_KEY is not set in environment');
      return null;
    }

    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

    try {
      const response = await axios.get<ExchangeRateApiResponse>(url, {
        timeout: 10000,
      });

      const data = response.data;
      if (data.result !== 'success') {
        this.fastify.log.error({ result: data.result }, 'Exchange rate API returned non-success result');
        return null;
      }

      const gelRate = data.conversion_rates?.GEL;
      if (typeof gelRate !== 'number' || !Number.isFinite(gelRate)) {
        this.fastify.log.error('GEL rate is missing or invalid in exchange rate API response');
        return null;
      }

      return gelRate;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        this.fastify.log.error(
          {
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            data: axiosError.response?.data,
            message: axiosError.message,
          },
          'Error while fetching exchange rates from API',
        );
      } else {
        this.fastify.log.error({ error }, 'Error while fetching exchange rates from API');
      }
      return null;
    }
  }

  /**
   * Ensure that there is a USD->GEL rate stored for the current UTC date.
   *
   * If a row already exists for today, this is a no-op and does not
   * call the external API. If no row exists, it fetches the rate from
   * exchangerate-api and upserts it into the exchange_rates table.
   */
  async ensureTodayUsdGelRate(): Promise<void> {
    const baseCurrency = 'USD';
    const targetCurrency = 'GEL';
    const rateDate = this.todayUtcDate;

    try {
      const existingRate = await this.getRateForDate(baseCurrency, targetCurrency, rateDate);
      if (existingRate !== null) {
        this.fastify.log.info(
          { baseCurrency, targetCurrency, rateDate, rate: existingRate },
          'Exchange rate for today already exists; skipping API call',
        );
        return;
      }

      const gelRate = await this.fetchUsdToGelRateFromApi();
      if (gelRate === null) {
        this.fastify.log.error('Failed to obtain USD->GEL rate from API; not updating exchange_rates table');
        return;
      }

      await this.upsertRate(baseCurrency, targetCurrency, gelRate, rateDate);

      this.fastify.log.info(
        { baseCurrency, targetCurrency, rateDate, rate: gelRate },
        'Inserted/updated USD->GEL exchange rate for today',
      );
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to ensure today\'s USD->GEL exchange rate');
    }
  }

  /**
   * Retrieve the most recently stored USD->GEL rate from the
   * exchange_rates table without calling the external API. This is
   * intended to be used at request time when converting prices for
   * responses, relying on the daily refresh job to keep data fresh.
   */
  async getLatestUsdGelRate(): Promise<number | null> {
    const anyFastify: any = this.fastify as any;
    const db = anyFastify.mysql;

    if (!db || typeof db.execute !== 'function') {
      this.fastify.log.error('MySQL pool is not available on fastify instance');
      return null;
    }

    try {
      const [rows] = (await db.execute(
        'SELECT rate FROM exchange_rates WHERE base_currency = ? AND target_currency = ? ORDER BY rate_date DESC LIMIT 1',
        ['USD', 'GEL'],
      )) as any[];

      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0] as { rate: number };
        const rate = typeof row.rate === 'number' ? row.rate : Number(row.rate);
        if (Number.isFinite(rate) && rate > 0) {
          return rate;
        }
      }

      return null;
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to read latest USD->GEL rate from exchange_rates');
      return null;
    }
  }
}
