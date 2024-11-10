import { generateEmbeddings } from '@/ai/embedding';
import { auth } from '@/app/(auth)/auth';
import { createResource, insertEmbeddings } from '@/db/queries';
import { BUCKET_NAME, minioClient } from '@/minio.config';
import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { z } from 'zod';

const FileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 3 * 1024 * 1024, {
      message: 'File size should be less than 3MB',
    })
    .refine((file) => ['application/pdf'].includes(file.type), {
      message: 'File type should be PDF',
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = file.name;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    try {
      const exists = await minioClient.bucketExists(BUCKET_NAME);
      if (!exists) {
        await minioClient.makeBucket(BUCKET_NAME);
      }

      if (session.user && session.user.id) {
        const [newResource] = await createResource({
          userId: session.user.id,
          name: filename,
          metadata: {
            contentType: file.type,
          },
        });

        const metadata = {
          'Content-Type': file.type,
        };

        await minioClient.putObject(
          BUCKET_NAME,
          `${newResource.id}.${filename.split('.').pop()}`,
          fileBuffer,
          file.size,
          metadata
        );

        if (file.type === 'application/pdf') {
          const parsed = await pdf(fileBuffer);
          const embeddings = await generateEmbeddings(parsed.text);
          await insertEmbeddings({
            resourceId: newResource.id,
            embeddings,
          });
        }
      }

      const data = {
        pathname: filename,
        contentType: file.type,
      };

      return NextResponse.json(data);
    } catch (error) {
      console.error('Failed to upload file', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
