import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const reqBody = await req.json();
  if (reqBody.type === "url_verification") {
    if (reqBody.token === process.env.SLACK_VERIFICATION_TOKEN!) {
      const challenge = reqBody.challenge;
      return NextResponse.json({ challenge }, { status: 200 });
    }
  }

  console.log(reqBody);
  return new NextResponse(null, { status: 200 });
}
