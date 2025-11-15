import axios from 'axios';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import FormData from 'form-data';

/**
 * Auction API Plugin
 *
 * Logs into auction-api.app on server startup and stores the token
 * on the Fastify instance so other services/controllers can reuse it
 * for authorized API calls.
 *
 * Credentials are read from environment variables:
 * - AUCTION_API_EMAIL
 * - AUCTION_API_PASSWORD
 */

declare module 'fastify' {
  interface FastifyInstance {
    auctionApiToken: string | null;
  }
}

const AUCTION_API_LOGIN_URL = 'https://auction-api.app/api/v1/login';

const auctionApiPlugin = fp(async (fastify: FastifyInstance) => {
  const email = process.env.AUCTION_API_EMAIL;
  const password = process.env.AUCTION_API_PASSWORD;

  if (!email || !password) {
    fastify.log.warn(
      'AUCTION_API_EMAIL or AUCTION_API_PASSWORD is not set. Auction API token will not be initialized.',
    );
    fastify.decorate('auctionApiToken', null);
    return;
  }

  try {
    // Use multipart/form-data to match the documented curl --form request
    const form = new FormData();
    form.append('email', email);
    form.append('password', password);

    const response = await axios.post<{ token: string }>(AUCTION_API_LOGIN_URL, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 15000,
    });

    if (!response.data || !response.data.token) {
      throw new Error('Auction API login response did not contain a token');
    }

    fastify.decorate('auctionApiToken', response.data.token);
    fastify.log.info({ token: response.data.token }, 'Auction API token initialized successfully');
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown Auction API auth error');
    fastify.log.error({ err }, 'Failed to initialize Auction API token');
    // Fail fast on startup so we dont run without required external auth
    throw err;
  }
});

export { auctionApiPlugin };
