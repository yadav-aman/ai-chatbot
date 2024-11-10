import { auth } from '@/app/(auth)/auth';
import { getUserResources } from '@/db/queries';

export async function GET() {
  let session = await auth();

  if (!session) {
    return Response.redirect('/login');
  }

  const { user } = session;

  if (!user) {
    return Response.redirect('/login');
  }

  if (!user.id) {
    return Response.redirect('/login');
  }

  const resources = await getUserResources({ userId: user.id });

  const response = resources.map((resource) => ({
    id: resource.id,
    pathname: resource.name,
    metadata: resource.metadata,
  }));

  return Response.json(response);
}
