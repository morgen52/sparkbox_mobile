function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? '');
}

export function isTransientBleConnectError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes('cancel') ||
    message.includes('disconnect') ||
    message.includes('connection timeout') ||
    message.includes('already connecting') ||
    message.includes('operation was aborted')
  );
}

export function formatBleConnectError(error: unknown): string {
  if (isTransientBleConnectError(error)) {
    return 'Sparkbox was slow to finish opening over Bluetooth. Keep your phone close and try Connect again.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Could not connect to Sparkbox over Bluetooth.';
}

export async function connectWithRetry<T>(
  connect: () => Promise<T>,
  options: { maxAttempts?: number; delayMs?: number } = {},
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 2);
  const delayMs = Math.max(0, options.delayMs ?? 600);

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await connect();
    } catch (error) {
      lastError = error;
      if (!isTransientBleConnectError(error) || attempt >= maxAttempts) {
        throw error;
      }
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Could not connect to Sparkbox over Bluetooth.');
}
