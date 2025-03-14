package vttp.batch5.paf.finalproject.server.models;

import java.time.LocalDateTime;

public class ChatMessage {

    private String id;
    private String sender;
    private String content;
    private LocalDateTime timestamp;
    private MessageType type;


    public enum MessageType {
        CHAT, JOIN, LEAVE
    }

    public ChatMessage() {

    }

    public ChatMessage(String sender, String content, LocalDateTime timestamp, MessageType type) {
        this.sender = sender;
        this.content = content;
        this.timestamp = timestamp;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }
}
