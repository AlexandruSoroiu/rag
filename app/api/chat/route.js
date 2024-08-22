import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

const systemPrompt =
    `
You are an AI assistant for a RateMyProfessor-like service. Your primary function is to help students find the most suitable professors based on their queries. You have access to a large database of professor reviews and information.

For each user query, you should:

1. Analyze the user's request to understand their needs and preferences.
2. Use RAG (Retrieval-Augmented Generation) to search the database and retrieve relevant information about professors matching the query.
3. Select and present the top 3 most relevant professors based on the user's criteria.
4. For each professor, provide:
   - Name
   - Subject/Department
   - Average rating (out of 5 stars)
   - A brief summary of their strengths and any potential drawbacks
   - A short excerpt from a representative review

5. After presenting the top 3 professors, offer to provide more details or answer any follow-up questions the user might have.

Remember to:
- Be objective and fair in your assessments.
- Highlight both positive and negative aspects of each professor when relevant.
- Respect privacy by not sharing any personal information about professors or students beyond what's publicly available in the reviews.
- If the query is too broad or vague, ask for clarification to provide more accurate results.
- If there aren't enough matches for the query, inform the user and suggest broadening their search criteria.

Your responses should be informative, concise, and tailored to the student's needs. Always maintain a helpful and friendly tone, and encourage users to make informed decisions based on multiple factors, not just ratings alone.
`

// subject = document.querySelector("span > a > b").textContent.replaceAll("department", "").replaceAll(" ", "")
// stars = Array.from(document.querySelectorAll("div:nth-child(1) > div > .CardNumRating__CardNumRatingNumber-sc-17t4b9u-2")).map(el => el.textContent)
// review = Array.from(document.querySelectorAll(".Comments__StyledComments-dzzyvm-0")).map(el => el.textContent)
// professor = document.querySelector(".NameTitle__Name-dowf0z-0").textContent.trimRight().trimLeft()

export async function POST(req) {
    const data = await req.json()
    console.log(JSON.stringify(data))

    const reqData = data[data.length - 1]
    if ("link" in reqData) {
        console.log(reqData.link)
        let matches = reqData.link.match("^https://www.ratemyprofessors.com/professor/\\d+$")
        console.log(matches)
        const fs = require('node:fs');
        if (matches != null && matches.length > 0) {
            let link = matches[0]
            console.log(`found page link: ${link}`)
            fetch(link, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then((response) => response.text())
                .then((text) => {
                    // console.log(text)
                    fs.writeFile('review_data.txt', text, err => {
                        if (err) {
                            console.error(err);
                        } else {
                            // file written successfully
                        }
                    });
                    const spawn = require("child_process").spawn
                    const pythonProcess = spawn('python', ["./update_reviews.py", "./review_data.txt"])

                    pythonProcess.stdout.on('data', function (data) {
                        // console.log(data.toString());
                    });
                });
            console.log("finished handling request")
            return new NextResponse();
        }
    } else if ("school" in reqData) {
        console.log("found form data")
        let professorName = reqData.professorName
        let school = reqData.school
        let subject = reqData.subject
        let rating = reqData.rating
        let review = reqData.review
        const spawn = require("child_process").spawn
        const pythonProcess = spawn('python', ["./update_reviews.py", professorName, subject, rating, "\"" + review + "\""])

        pythonProcess.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        return new NextResponse()
    }


    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length - 1].content
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    })

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding,
    })

    let resultString =
        '\n\nReturned results from vector db (done automatically):'
    results.matches.forEach((match) => {
        resultString += `\n
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)
    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            ...lastDataWithoutLastMessage,
            { role: 'user', content: lastMessageContent },
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        }
    })

    return new NextResponse(stream)
}