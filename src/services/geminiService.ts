import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateStudentRoadmap(studentData: any) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following student data and generate a personalized growth roadmap, skill enhancement suggestions, and internship recommendations.
    Data: ${JSON.stringify(studentData)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roadmap: { type: Type.STRING, description: "A step-by-step growth plan." },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific skills to learn." },
          internships: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recommended internship roles." },
          performanceAnalysis: { type: Type.STRING, description: "Analysis of current performance." }
        },
        required: ["roadmap", "suggestions", "internships", "performanceAnalysis"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function getAIInstantAnswer(query: string, context: any) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Context: ${JSON.stringify(context)}\n\nQuery: ${query}`,
    config: {
      systemInstruction: "You are an AI Academic Advisor. Provide helpful, concise, and accurate guidance based on the provided student/academic context."
    }
  });
  return response.text;
}

export async function summarizeAssignment(content: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize the following assignment/essay content into key points and a brief conclusion:
    Content: ${content}`,
  });
  return response.text;
}

export async function solveDoubt(doubt: string, subject: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Subject: ${subject}\n\nQuestion: ${doubt}`,
    config: {
      systemInstruction: "You are an expert academic tutor. Provide a clear, step-by-step explanation to solve the student's doubt."
    }
  });
  return response.text;
}

export async function debugCode(code: string, language: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Language: ${language}\n\nCode:\n${code}`,
    config: {
      systemInstruction: "You are a senior software engineer. Identify bugs in the provided code, explain the issues, and provide the corrected version."
    }
  });
  return response.text;
}

export async function buildResume(studentData: any, skills: string[], projects: any[], certifications: any[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a professional resume in Markdown format based on the following data:
    Profile: ${JSON.stringify(studentData)}
    Skills: ${JSON.stringify(skills)}
    Projects/Internships: ${JSON.stringify(projects)}
    Certifications: ${JSON.stringify(certifications)}`,
  });
  return response.text;
}

export async function verifyFace(capturedImageBase64: string, storedImageBase64: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: "Compare these two images. Image 1 is a stored profile picture. Image 2 is a live capture for attendance. Determine if they are the same person. Return a JSON object with 'match' (boolean) and 'confidence' (number 0-1)." },
        { inlineData: { data: storedImageBase64.split(',')[1] || storedImageBase64, mimeType: "image/jpeg" } },
        { inlineData: { data: capturedImageBase64.split(',')[1] || capturedImageBase64, mimeType: "image/jpeg" } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          match: { type: Type.BOOLEAN },
          confidence: { type: Type.NUMBER }
        },
        required: ["match", "confidence"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function verifyCertificationWithAI(certTitle: string, certIssuer: string, certUrl: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Verify if the following certification is valid based on the provided URL.
    Title: ${certTitle}
    Issuer: ${certIssuer}
    URL: ${certUrl}`,
    config: {
      tools: [{ urlContext: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValid: { type: Type.BOOLEAN, description: "Whether the certification is valid and matches the details." },
          confidence: { type: Type.NUMBER, description: "Confidence score (0-1)." },
          reason: { type: Type.STRING, description: "Reason for the decision." }
        },
        required: ["isValid", "confidence", "reason"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}
