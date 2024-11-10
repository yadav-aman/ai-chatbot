import { customModel } from '@/ai';
import { DEFAULT_MODEL_ID } from '@/ai/models';
import { saveDocument } from '@/db/queries';
import { generateUUID } from '@/lib/utils';
import { StreamData, streamText } from 'ai';
import { Session } from 'next-auth';

export const createDocument = async ({
  title = 'Untitled',
  stream,
  modelId = DEFAULT_MODEL_ID,
  session,
}: {
  title?: string;
  stream: StreamData;
  modelId: string;
  session: Session;
}) => {
  const id = generateUUID();
  let draftText = '';

  stream.append({
    type: 'id',
    content: id,
  });

  stream.append({
    type: 'title',
    content: title,
  });

  stream.append({
    type: 'clear',
    content: '',
  });

  const { fullStream } = await streamText({
    model: customModel(modelId),
    system:
      'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
    prompt: title,
  });

  for await (const delta of fullStream) {
    const { type } = delta;

    if (type === 'text-delta') {
      const { textDelta } = delta;

      draftText += textDelta;
      stream.append({
        type: 'text-delta',
        content: textDelta,
      });
    }
  }

  stream.append({ type: 'finish', content: '' });

  if (session.user && session.user.id) {
    await saveDocument({
      id,
      title,
      content: draftText,
      userId: session.user.id,
    });
  }

  return {
    id,
    title,
    content: `A document was created and is now visible to the user.`,
  };
};
