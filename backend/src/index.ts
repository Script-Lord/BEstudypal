import 'dotenv/config';
import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT ?? 3001;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
