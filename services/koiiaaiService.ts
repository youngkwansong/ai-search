
import { Message, Role } from '../types';

const KOIIAAI_WEBHOOK_URL = "http://192.168.109.254:30683/webhook/d594e532-182f-40bf-a5f6-a4f1abfb5c5c/chat";

export async function* generateKoiiaaiResponse(chatInput: Message[], sessionId: string): AsyncGenerator<Message, void, unknown> {
    try {
        const response = await fetch(KOIIAAI_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chatInput, sessionId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Failed to get readable stream from response.");
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });

            // Process all complete JSON objects currently in the buffer
            while (buffer.length > 0) {
                try {
                    let endIndex = -1;
                    let openBraceCount = 0;
                    for (let i = 0; i < buffer.length; i++) {
                        if (buffer[i] === '{') {
                            openBraceCount++;
                        } else if (buffer[i] === '}') {
                            openBraceCount--;
                        }
                        if (openBraceCount === 0 && buffer[i] === '}') {
                            endIndex = i;
                            break;
                        }
                    }

                    if (endIndex === -1) {
                        // No complete JSON object found yet in the buffer, need more data
                        break;
                    }

                    const jsonStr = buffer.substring(0, endIndex + 1);
                    const rawData = JSON.parse(jsonStr);

                    if (rawData.type === 'item') {
                        const outputContent = rawData.content || "";
                        yield { role: Role.MODEL, content: outputContent };
                    }
                    // Remove the parsed JSON object from the buffer
                    buffer = buffer.substring(endIndex + 1).trimStart();

                } catch (e) {
                    // If JSON.parse fails, it might be an incomplete JSON or malformed.
                    // Break and wait for more data, or log and continue if it's truly malformed.
                    console.warn("Failed to parse JSON from buffer. Waiting for more data or malformed JSON:", buffer, e);
                    break;
                }
            }

            if (done) {
                break;
            }
        }

        // If after the stream is done, there's still content in the buffer, try to parse it.
        if (buffer.length > 0) {
             try {
                const rawData = JSON.parse(buffer);
                if (rawData.type === 'item') {
                    const outputContent = rawData.content || "";
                    yield { role: Role.MODEL, content: outputContent };
                }
            } catch (e) {
                console.warn("Failed to parse remaining buffer as JSON:", buffer, e);
            }
        }

    } catch (error) {
        console.error("Error calling Koiiaai streaming service:", error);
        throw new Error("Failed to get a streaming response from Koiiaai service.");
    }
}
