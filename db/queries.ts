'server-only';

import { generateEmbedding, generateEmbeddings } from '@/ai/embedding';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import {
  and,
  asc,
  cosineDistance,
  desc,
  eq,
  gt,
  inArray,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  chat,
  document,
  embedding,
  Message,
  message,
  resource,
  Suggestion,
  suggestion,
  user,
  User,
  vote,
} from './schema';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}`);
let db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' ? true : false })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    } else {
      return await db.insert(vote).values({
        chatId,
        messageId,
        isUpvoted: type === 'up' ? true : false,
      });
    }
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database'
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database'
    );
    throw error;
  }
}

export async function createResource({
  name,
  userId,
  metadata,
}: {
  name: string;
  userId: string;
  metadata: Record<string, any>;
}) {
  try {
    return await db
      .insert(resource)
      .values({ name, userId, metadata })
      .returning({
        id: resource.id,
      });
  } catch (error) {
    console.error('Failed to create resource in database');
    throw error;
  }
}

export async function insertEmbeddings({
  resourceId,
  embeddings,
}: {
  resourceId: string;
  embeddings: Awaited<ReturnType<typeof generateEmbeddings>>;
}) {
  try {
    return await db
      .insert(embedding)
      .values(embeddings.map((e) => ({ resourceId, ...e })));
  } catch (error) {
    console.error('Failed to create embeddings in database');
    throw error;
  }
}

export async function getUserResources({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(resource)
      .where(eq(resource.userId, userId))
      .orderBy(desc(resource));
  } catch (error) {
    console.error('Failed to get user resources from database');
    throw error;
  }
}

export async function getUserResource({
  userId,
  resourceIds,
}: {
  userId: string;
  resourceIds: string[];
}) {
  try {
    return await db
      .select()
      .from(resource)
      .where(
        and(eq(resource.userId, userId), inArray(resource.id, resourceIds))
      );
  } catch (error) {
    console.error('Failed to get user resources from database');
    throw error;
  }
}

export async function getSimilarResults(
  query: string,
  userId: string,
  selectedFiles: string[]
) {
  if (!selectedFiles.length) {
    return [];
  }

  try {
    const queryEmbedding = await generateEmbedding(query);
    const similarity = sql<number>`1 - (${cosineDistance(
      embedding.embedding,
      queryEmbedding
    )})`;

    const results = await db
      .select({
        resourceId: embedding.resourceId,
        content: embedding.content,
        source: resource.name,
        similarity,
      })
      .from(embedding)
      .leftJoin(resource, eq(embedding.resourceId, resource.id))
      .where(
        and(
          eq(resource.userId, userId),
          gt(similarity, 0.2),
          inArray(embedding.resourceId, selectedFiles)
        )
      )
      .orderBy((t) => desc(t.similarity))
      .limit(5);

    debugger;

    return results;
  } catch (error) {
    console.error('Failed to get similar results from database');
    throw error;
  }
}