import session from "express-session";
import * as crypto from 'crypto';

export interface ChatMessage {
    userMessage: string,
    assistantMessage: string
}

export class ChatSessionManager {
    private sessions: {[key:string]: ChatSession} = {};
    public createSession(): string {
        const sID = crypto.randomBytes(64).toString('hex');
        this.sessions[sID] = new ChatSession(this, sID);
        return sID;
    }

    public getSessionMessages(sessionID: string): ChatMessage[] {
        const messages = this.sessions[sessionID]?.fetchMessages() as ChatMessage[];
        return messages;
    }

    public sessionExists(sessionID: string): boolean {
        return Object.hasOwn(this.sessions, sessionID);
    }

    public removeSession(sessionID: string) {
        delete this.sessions[sessionID];
    }

    public addSessionMessage(sessionID: string, userMessage: string, assistantMessage: string) {
        this.sessions[sessionID]?.addMessage(userMessage, assistantMessage);
    }
}

export class ChatSession {
    public messages: ChatMessage[] = [];
    public sessionTimeRemaining: number;
    constructor (sessionManager: ChatSessionManager, id: string) {
        this.sessionTimeRemaining = 30;

        setInterval((session: ChatSession, manager: ChatSessionManager, id: string) => {
            session.sessionTimeRemaining--;
            if (session.sessionTimeRemaining <= 0) {
                manager.removeSession(id);
            }
        }, 60000, this, sessionManager, id);
    }

    public addMessage(userMessage: string, assistantMessage: string) {
        this.sessionTimeRemaining += 5;
        this.messages.push({userMessage: userMessage, assistantMessage: assistantMessage} as ChatMessage);
    }

    public fetchMessages(): ChatMessage[] {
        return this.messages;
    }
}