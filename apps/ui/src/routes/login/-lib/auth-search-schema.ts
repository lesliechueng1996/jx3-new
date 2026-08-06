import { z } from 'zod';

export const authSearchSchema = z.object({
  redirect: z
    .string()
    .optional()
    .transform((value) =>
      value?.startsWith('/') && !value.startsWith('//') ? value : undefined,
    ),
});
