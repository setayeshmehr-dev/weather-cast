const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;
const RETRY_DELAYS_MS = [800, 2000];

type FetchJsonOptions = {
    signal?: AbortSignal;
    timeoutMs?: number;
    retries?: number;
};

class HttpError extends Error {
    status: number;

    constructor(status: number) {
        super(`Request failed with status ${status}.`);
        this.status = status;
    }
}

function abortError(): DOMException {
    return new DOMException("Aborted", "AbortError");
}

// Server errors and rate limits are worth another try; other statuses are not.
function isRetryable(error: unknown): boolean {
    if (error instanceof HttpError) {
        return error.status === 429 || error.status >= 500;
    }

    // Network errors and timeouts.
    return true;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(abortError());
            return;
        }

        let timer = 0;

        const onAbort = () => {
            window.clearTimeout(timer);
            reject(abortError());
        };

        timer = window.setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);

        signal?.addEventListener("abort", onAbort, { once: true });
    });
}

/**
 * fetch + json with a timeout and a few retries (with a short pause), so a slow
 * or failing request does not leave a card on its skeleton until a page refresh.
 */
export async function fetchJson<T>(
    url: string,
    {
        signal,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        retries = DEFAULT_RETRIES,
    }: FetchJsonOptions = {}
): Promise<T> {
    for (let attempt = 0; ; attempt++) {
        const request = new AbortController();
        const timer = window.setTimeout(() => request.abort(), timeoutMs);
        const forward = () => request.abort();

        signal?.addEventListener("abort", forward, { once: true });

        try {
            if (signal?.aborted) throw abortError();

            const response = await fetch(url, { signal: request.signal });

            if (!response.ok) throw new HttpError(response.status);

            return (await response.json()) as T;
        } catch (error) {
            if (signal?.aborted || attempt >= retries || !isRetryable(error)) {
                throw error;
            }
        } finally {
            window.clearTimeout(timer);
            signal?.removeEventListener("abort", forward);
        }

        await wait(
            RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)],
            signal
        );
    }
}