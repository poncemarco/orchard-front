import type { APIRoute } from 'astro';
import { mockApi } from '../../../services/mockApi';

export const GET: APIRoute = async () => {
  const result = await mockApi.getZones();
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-Backend': 'Astro-IoT-Hub-v1',
    },
  });
};
