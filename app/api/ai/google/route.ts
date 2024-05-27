import ConnectToDB from "@/lib/connectToDB";
import { Model } from "@/lib/gemini-prompt";
import { User, UserType } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: [
        {
          text: "drive is connected with slack, and slack is connected with discord",
        },
      ],
    },
    {
      role: "model",
      parts: [{ text: Model }],
    },
  ],
});

const promptSchema = z.object({
  prompt: z.string().min(20, "Prompt should contain atleast 20 charaters."),
});

export const POST = async (req: NextRequest) => {
  try {
    const { prompt } = promptSchema.parse(await req.json());

    ConnectToDB();
    const user = await currentUser();
    const dbUser = await User.findOne<UserType>(
      { userId: user?.id },
      { tier: 1 }
    );

    if (!dbUser) throw new Error("user is not authenticated");

    if (dbUser && dbUser.tier !== "Premium Plan") {
      throw new Error("Bad request");
    }

    const result = await chat.sendMessage(prompt);
    let response = result.response.text();

    let i = 0;
    while (i < response.length) {
      if (response[i] === "{") break;
      i++;
    }

    response = response.slice(i);

    i = response.length - 1;
    while (i >= 0) {
      if (response[i] === "}") break;
      i--;
    }

    response = response.slice(0, i + 1);

    return NextResponse.json({ data: response });
  } catch (error: any) {
    console.log(error?.message);
    if (error instanceof ZodError) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Something went wrong, please try again later.", {
      status: 500,
    });
  }
};
