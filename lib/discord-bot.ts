import WebSocket from "ws";

type DiscordUser = {
  id: string;
  username: string;
  bot?: boolean;
};

type ReceivedEvents = {
  HELLO: {
    op: number;
    d: {
      heartbeat_interval: number;
    };
  };
  READY: {
    user: DiscordUser;
    guilds: [{ id: string; unavailable: boolean }];
    session_id: string;
    resume_gateway_url: string;
  };
  RESUMED: null;
  MESSAGE_CREATE: {
    channel_id: string;
    mentions: DiscordUser[];
    mention_roles: string[];
    type: number; // DEFAULT (0), REPLY (19)
    webhook_id?: string;
    author: Omit<DiscordUser, "bot">;
  };
  MESSAGE_REACTION_ADD: {
    user_id: string;
    channel_id: string;
    guild_id?: string;
    emoji: {
      id?: string;
      name?: string;
    };
    type: number; // NORMAL (0)
  };
  GUILD_MEMBER_ADD: {
    guild_id: string;
    user?: DiscordUser;
  };
};

type UserReceiveEvents =
  | "messageCreate"
  | "messageReactionAdd"
  | "guildMemberAdd";

// Configuration
const API_VERSION = "10";
const ENCODING = "json";

// Exponential backoff settings
const RECONNECT_BASE_DELAY = 5000; // 5 seconds
const RECONNECT_MAX_DELAY = 300000; // 5 minutes
const CloseCodeSet = new Set<number>([
  1000, 1001, 4004, 4010, 4011, 4012, 4013, 4014,
]);

class DiscordClient {
  private BOT_TOKEN: string | null = null;
  private gatewayURL: string | null = null;
  private sessionId: string | null = null;
  private resumeGatewayURL: string | null = null;
  private sequenceNumber: number | null = null;
  private heartbeatInterval: number | null = null;
  private heartbeatAckReceived = false;
  private intervalId: null | NodeJS.Timeout = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private zombiedTimeout: NodeJS.Timeout | null = null;
  private ws: WebSocket | null = null;

  private eventHandlers: { [key: string]: Function[] } = {};

  constructor(token: string) {
    this.BOT_TOKEN = token;
  }

  private async getGatewayURL() {
    try {
      if (!this.BOT_TOKEN) {
        throw new Error("BOT_TOKEN is required");
      }

      const response = await fetch("https://discord.com/api/v10/gateway/bot", {
        headers: {
          Authorization: `Bot ${this.BOT_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Error getting gateway URL: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      this.gatewayURL = data.url;
    } catch (error) {
      console.error("Error getting gateway URL:", error);
    }
  }

  private sendHeartbeat(ws: WebSocket) {
    if (this.heartbeatInterval === null) {
      this.connectToGateway();
      return;
    }

    const heartbeatPayload = {
      op: 1,
      d: this.sequenceNumber,
    };

    ws.send(JSON.stringify(heartbeatPayload));

    // Indicate that heartbeat Ack is not received for the current heartbeat.
    // Waiting for the heartbeat Ack
    this.heartbeatAckReceived = false;
    console.debug("Sent heartbeat");

    // Check for Zombied connection
    if (this.zombiedTimeout) clearTimeout(this.zombiedTimeout);
    this.zombiedTimeout = setTimeout(() => {
      if (!this.heartbeatAckReceived) {
        console.warn("Heartbeat ACK not received. Reconnecting...");
        ws.close(1011, "Zombied Connection"); // Close with a non-1000/1001 code
        this.reconnectToGateway();
      }
    }, this.heartbeatInterval * 0.85); // Check a bit before the next heartbeat is due
  }

  private startHeartbeat(ws: WebSocket) {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.heartbeatInterval) {
      this.sendHeartbeat(ws);

      this.intervalId = setInterval(() => {
        this.sendHeartbeat(ws);
      }, this.heartbeatInterval);
    }
  }

  private handleHello(data: any, ws: WebSocket) {
    this.heartbeatInterval = data.heartbeat_interval;
    this.startHeartbeat(ws);
  }

  // Function to handle the READY event
  private handleReady(data: ReceivedEvents["READY"]) {
    this.sessionId = data.session_id;
    this.resumeGatewayURL = data.resume_gateway_url;

    console.log(`Ready! Logged in as ${data.user.username}`);
  }

  private handleDispatch(eventName: keyof ReceivedEvents, eventData: any) {
    switch (eventName) {
      case "READY":
        this.handleReady(eventData);
        break;
      case "RESUMED":
        console.log("Resumed gateway connection");
        break;
      case "MESSAGE_CREATE":
        this.emit("messageCreate", eventData);
        break;
      case "MESSAGE_REACTION_ADD":
        this.emit("messageReactionAdd", eventData);
        break;
      case "GUILD_MEMBER_ADD":
        this.emit("guildMemberAdd", eventData);
        break;
      default:
        console.log(`Received event: ${eventName}`);
    }
  }

  // Function to handle the Invalid Session event
  private handleInvalidSession(resumable: boolean) {
    if (resumable) {
      console.log("Invalid session, attempting to resume...");
      this.reconnectToGateway();
    } else {
      console.log("Invalid session, re-identifying...");
      this.sessionId = null;
      this.resumeGatewayURL = null;
      this.connectToGateway();
    }
  }

  private handleMessage(ws: WebSocket, data: WebSocket.Data) {
    const message = JSON.parse(data.toString());
    const { op, t, d, s } = message;

    if (s) this.sequenceNumber = s;

    switch (op) {
      case 0: // Dispatch
        this.handleDispatch(t, d);
        break;
      case 1: // Heartbeat
        this.startHeartbeat(ws);
        break;
      case 7: // Reconnect
        console.log("Received reconnect request from gateway");
        this.reconnectToGateway();
        break;
      case 9: // Invalid Session
        this.handleInvalidSession(d);
        break;
      case 10: // Hello
        this.handleHello(d, ws);
        break;
      case 11: // Heartbeat ACK
        this.heartbeatAckReceived = true;
        console.debug("Received heartbeat ACK");
        break;
      default:
        console.warn(`Unknown opcode: ${op}`);
    }
  }

  // Function to send an Identify payload
  private sendIdentify(ws: WebSocket) {
    const identifyPayload = {
      op: 2,
      d: {
        token: this.BOT_TOKEN,
        // GUILDS (1<<0) | GUILD_MEMBERS (1<<1) | GUILD_MESSAGES (1<<9) | GUILD_MESSAGE_REACTIONS (1<<10)
        intents: 1539,
        properties: {
          os: process.platform,
          browser: "node-discord-bot",
          device: "node-discord-bot",
        },
      },
    };

    ws.send(JSON.stringify(identifyPayload));
  }

  // Function to send a Resume payload
  private sendResume(ws: WebSocket) {
    const resumePayload = {
      op: 6,
      d: {
        token: this.BOT_TOKEN,
        session_id: this.sessionId,
        seq: this.sequenceNumber,
      },
    };

    ws.send(JSON.stringify(resumePayload));
  }

  // Function to reconnect to the gateway
  private reconnectToGateway() {
    this.reconnectAttempts++;
    const reconnectDelay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_DELAY
    );

    console.log(
      `Gateway disconnected, attempting to reconnect in ${
        reconnectDelay / 1000
      } seconds...`
    );

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    this.reconnectTimeout = setTimeout(() => {
      this.connectToGateway(this.resumeGatewayURL);
    }, reconnectDelay);
  }

  // Function to handle gateway disconnections
  private handleClose(code: number | null) {
    // Clear heartbeat interval on close
    if (this.intervalId) clearInterval(this.intervalId);

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    if (code === null || CloseCodeSet.has(code)) {
      console.log("Close code indicates no reconnect should be attempted.");
      return;
    }
  }

  private async connectToGateway(resumeGatewayURL?: string | null) {
    try {
      if (!this.gatewayURL) {
        await this.getGatewayURL();
      }

      this.ws = new WebSocket(
        `${
          resumeGatewayURL ? resumeGatewayURL : this.gatewayURL
        }?v=${API_VERSION}&encoding=${ENCODING}`
      );

      if (this.ws !== null) {
        this.ws.on("open", () => {
          console.log("Connected to gateway");
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          this.heartbeatAckReceived = true;

          if (this.sessionId) {
            this.sendResume(this.ws!);
          } else {
            this.sendIdentify(this.ws!);
          }
        });

        this.ws.on("message", (data) => {
          this.handleMessage(this.ws!, data);
        });

        this.ws.on("close", (code, reason) => {
          console.log(
            `Gateway connection closed: ${code} ${reason.toString("utf-8")}`
          );
          this.handleClose(code);
        });

        this.ws.on("error", (error) => {
          console.error("Gateway connection error:", error.message);
          this.handleClose(null);
        });
      } else {
        throw new Error("WebSocket client not found");
      }
    } catch (error) {
      console.error("Error connecting to gateway:", error);
    }
  }

  public connect() {
    this.connectToGateway();
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  private handleMessageCreate(data: ReceivedEvents["MESSAGE_CREATE"]) {
    const message = {
      channel_id: data.channel_id,
      mentions: data.mentions.map((mention) => mention),
      mention_roles: data.mention_roles,
      type: data.type,
      webhook_id: data.webhook_id,
      author: {
        id: data.author.id,
        username: data.author.username,
      },
    };

    return message;
  }

  private handleMessageReaction(data: ReceivedEvents["MESSAGE_REACTION_ADD"]) {
    const {
      channel_id,
      emoji: { id, name },
      type,
      user_id,
      guild_id,
    } = data;

    return { channel_id, emoji: { id, name }, type, user_id, guild_id };
  }

  private handleMemberAdd(data: ReceivedEvents["GUILD_MEMBER_ADD"]) {
    const member = {
      guild_id: data.guild_id,
      user: data.user
        ? { id: data.user.id, username: data.user.username, bot: data.user.bot }
        : undefined,
    };

    return member;
  }

  private emit(event: string, data: any) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach((handler) => {
        if (event === "messageCreate") handler(this.handleMessageCreate(data));
        else if (event === "messageReactionAdd")
          handler(this.handleMessageReaction(data));
        else handler(this.handleMemberAdd(data));
      });
    }
  }

  public on(event: UserReceiveEvents, handler: Function) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  public off(event: UserReceiveEvents, handler: Function) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(
        (h) => h !== handler
      );
    }
  }
}

export default DiscordClient;
