import { absolutePathUrl } from "@/lib/utils";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const reqBody = await req.json();

    // This reflects the type of callback you're receiving. Typically, that is 'event_callback'. You may encounter 'url_verification' during the configuration process.
    if (reqBody && reqBody.token === process.env.SLACK_VERIFICATION_TOKEN!) {
      if (reqBody.type === "url_verification") {
        const challenge = reqBody.challenge;
        return NextResponse.json({ challenge }, { status: 200 });
      } else if (reqBody.type === "event_callback") {
        const { event, authorizations } = reqBody;
        // team_id: 'T08TACWL6CV',
        // user_id: 'U01U7TXS03M',
        switch (event.type) {
          case "message":
            if (!event.subtype) {
              const { channel, channel_type } = event;
              axios
                .get(`https://synapsse.vercel.app/api/automate`, {
                  params: {
                    channelId: channel,
                    channelType: channel_type,
                    eventType: "0",
                  },
                })
                .then((data) => console.log(data.status))
                .catch((error) => console.log(error));

              // console.log("messageCreate", channel, channel_type);
            } else if (event.subtype === "file_share") {
              const { channel, channel_type } = event;
              /**
               * files: { created, name, is_public, file_access = "visible" }
               */
              axios
                .get(`https://synapsse.vercel.app/api/automate`, {
                  params: {
                    channelId: channel,
                    channelType: channel_type,
                    eventType: "1",
                  },
                })
                .then((data) => console.log(data.status))
                .catch((error) => console.log(error));
              // console.log("fileShare", channel, channel_type, files);
            }
            break;
          case "reaction_added":
            const {
              item: { channel },
            } = event;
            axios
              .get(`https://synapsse.vercel.app/api/automate`, {
                params: {
                  channelId: channel,
                  eventType: "2",
                },
              })
              .then((data) => console.log(data.status))
              .catch((error) => console.log(error));
            // console.log("reactionAdded", reaction, channel);
            break;
          case "channel_created":
            const {
              channel: { id, is_channel },
            } = event;
            axios
              .get(`https://synapsse.vercel.app/api/automate`, {
                params: {
                  channelId: id,
                  isChannel: is_channel,
                  eventType: "3",
                },
              })
              .then((data) => console.log(data.status))
              .catch((error) => console.log(error));
            // console.log("channel_created");
            break;
          case "member_joined_channel":
            {
              const { channel, channel_type, team } = event;
              axios
                .get("absolutePathUrl()/api/automate", {
                  params: {
                    channelId: channel,
                    channelType: channel_type,
                    eventType: "4",
                    teamId: team,
                  },
                })
                .then((data) => console.log(data.status))
                .catch((error) => console.log(error));
              // console.log("member_joined_channel", channel, channel_type);
            }
            break;
          default:
            break;
        }
      }
      return new NextResponse(null, { status: 200 });
    }

    return new NextResponse(null, { status: 400 });
  } catch (error: any) {
    console.log(error?.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
