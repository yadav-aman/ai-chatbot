import { customModel } from '@/ai';
import { DEFAULT_MODEL_ID } from '@/ai/models';
import { getDocumentById, saveDocument } from '@/db/queries';
import { StreamData, streamText } from 'ai';
import { Session } from 'next-auth';

export const updateDocument = async ({
  id,
  description,
  stream,
  modelId = DEFAULT_MODEL_ID,
  session,
}: {
  id: string;
  description: string;
  stream: StreamData;
  modelId: string;
  session: Session;
}) => {
  const document = await getDocumentById({ id });

  if (!document) {
    return {
      error: 'Document not found',
    };
  }

  const { content: currentContent } = document;
  let draftText: string = '';

  stream.append({
    type: 'clear',
    content: document.title,
  });

  const { fullStream } = await streamText({
    model: customModel(modelId),
    system:
      'You are a helpful writing assistant. Based on the description, please update the piece of writing.',
    messages: [
      {
        role: 'user',
        content: description,
      },
      { role: 'user', content: currentContent || '' },
    ],
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
      title: document.title,
      content: draftText,
      userId: session.user.id,
    });

    return {
      id,
      title: document.title,
      content: 'The document has been updated successfully.',
    };
  }
};
