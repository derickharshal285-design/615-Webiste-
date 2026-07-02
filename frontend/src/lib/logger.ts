import { authFetch } from './authFetch';

export const logSystemError = async (action: string, errorDetails: any) => {
  try {
    let details: Record<string, any> = {};
    if (errorDetails instanceof Error) {
      details = { message: errorDetails.message, stack: errorDetails.stack };
    } else if (typeof errorDetails === 'string') {
      details = { message: errorDetails };
    } else {
      details = errorDetails || {};
    }

    await authFetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify({ action, details })
    });
  } catch (e) {
    console.error("Failed to push log to server", e);
  }
};
