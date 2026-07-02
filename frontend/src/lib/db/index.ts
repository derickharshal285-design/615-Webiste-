import { DatabaseService } from './interface';
import { ApiAdapter } from './api-adapter';

// This is the active database adapter. It uses the API, which natively hooks into the Supabase database.
export const dbService: DatabaseService = new ApiAdapter();
