import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GENERATION_PROMPT, IMAGE_MODEL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, prompt, size } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const imageFile = new File([imageBuffer], 'input.png', { type: 'image/png' });

    const response = await openai.images.edit({
      model: IMAGE_MODEL,
      image: imageFile,
      prompt: prompt || GENERATION_PROMPT,
      size: size || '1024x1024',
      quality: 'high',
      input_fidelity: 'high',
    });

    const generatedImage = response.data?.[0]?.b64_json;

    if (!generatedImage) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageBase64: generatedImage });
  } catch (error) {
    console.error('Image generation error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 500 }
    );
  }
}
