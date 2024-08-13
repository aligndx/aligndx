import { API } from '@/config-global';
import PocketBase, { SendOptions } from 'pocketbase';

interface HttpError extends Error {
    status?: number;
}

export class Client extends PocketBase {
    async refreshAuthIfNeeded() {
        if (!this.authStore.isValid) {
            await this.collection('users').authRefresh();
        }
    }

    async send<T = any>(path: string, options: SendOptions): Promise<T> {
        try {
            return await super.send<T>(path, options);
        } catch (error) {
            const httpError = error as HttpError;
            if (httpError?.status === 401) {
                await this.collection('users').authRefresh();
                return await super.send<T>(path, options);
            }
            throw error;
        }
    }
}
export const client = new Client(API);
