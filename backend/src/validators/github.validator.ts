import { z } from 'zod';

export const connectGitHubSchema = z.object({
  username: z.string().min(1, { message: 'GitHub username is required' }).max(100),
  accessToken: z.string().optional(),
});

export type ConnectGitHubDTO = z.infer<typeof connectGitHubSchema>;
