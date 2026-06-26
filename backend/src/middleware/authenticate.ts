import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';

export interface AuthedRequest extends Request {
  user: { id: string; email: string };
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  (req as AuthedRequest).user = { id: user.id, email: user.email ?? '' };
  next();
}
