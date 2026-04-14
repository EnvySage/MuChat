
class WsClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.handlers = new Set();
    this.isAuthed = false;
  }

  connect(token) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.send({ type: "AUTH", token });
      };

      this.ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === "AUTH_RESULT") {
          this.isAuthed = msg.code === 0;
          if (this.isAuthed) resolve(msg);
          else reject(new Error(msg.message || "认证失败"));
          return;
        }

        this.handlers.forEach((fn) => fn(msg));
      };

      this.ws.onerror = reject;
      this.ws.onclose = () => {
        this.isAuthed = false;
      };
    });
  }

  onMessage(fn) {
    this.handlers.add(fn);
    return () => this.handlers.delete(fn);
  }

  joinGroup(chatRoomId) {
    this.send({ type: "JOIN_GROUP", chatRoomId });
  }

  leaveGroup(chatRoomId) {
    this.send({ type: "LEAVE_GROUP", chatRoomId });
  }

  sendGroupMessage(chatRoomId, content, contentType = "TEXT", senderId, senderName, senderAvatar, sentAt = Date.now(), fileName = null, fileSize = null) {
    this.send({
      type: "GROUP",
      chatRoomId,
      content,
      contentType,
      senderId,
      senderName,
      senderAvatar,
      sentAt,
      fileName,
      fileSize
    });
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(data));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

export const wsClient = new WsClient(import.meta.env.VITE_WS_URL);