import ConnectToDB from "@/lib/connectToDB";
import { Model as modalPrompt } from "@/lib/gemini-prompt";
z;
import { User, UserType } from "@/models/user.model";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const promptSchema = z.object({
  prompt: z.string().min(20, "Prompt should contain atleast 20 charaters."),
});

export const POST = async (req: NextRequest) => {
  try {
    const { prompt } = promptSchema.parse(await req.json());

    await ConnectToDB();
    const { userId } = await auth();
    const dbUser = await User.findOne<Pick<UserType, "tier" | "_id">>(
      { userId },
      { tier: 1 }
    );

    if (!dbUser) throw new Error("user is not authenticated");

    if (dbUser.tier !== "Premium") {
      throw new Error("Bad request. Subscribe to Premium Plan");
    }

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: prompt }] },
        { role: "model", parts: [{ text: modalPrompt }] },
      ],
    });
    return NextResponse.json({ data: result.response.text() });
  } catch (error) {
    if (error instanceof ZodError) {
      return new NextResponse(error.message, { status: 500 });
    }

    return new NextResponse("Something went wrong, please try again later.", {
      status: 500,
    });
  }
};
