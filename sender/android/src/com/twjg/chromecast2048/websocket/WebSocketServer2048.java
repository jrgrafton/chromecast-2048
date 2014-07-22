package com.twjg.chromecast2048.websocket;

import android.util.Log;

import com.twjg.chromecast2048.activities.MainActivity;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;
import java.util.logging.Logger;

/**
 * Created by jrgrafton on 7/16/14.
 */
public class WebSocketServer2048 extends WebSocketServer {
    public static final int SOCKET = 8887;

    private static final String TAG = MainActivity.class.getSimpleName();
    private WebSocket mClientConnection;

    public WebSocketServer2048() {
        super(new InetSocketAddress(SOCKET));
    }

    @Override
    public void onOpen(WebSocket conn,
                       ClientHandshake handshake) {
        //Handle new connection here
    }

    @Override
    public void onMessage(WebSocket conn,
                          String message) {
        //Handle client received message here
        //send a message back:
        Log.d(TAG, "Received message: " + message);
        if(this.mClientConnection == null) {
            this.mClientConnection = conn;
        }
    }

    @Override
    public void onClose(WebSocket conn, int code,
                        String reason, boolean remote) {
        //Handle closing connection here
    }

    @Override
    public void onError(WebSocket conn,
                        Exception exc) {
        //Handle error during transport here
    }

    /**
     * Send message to last connected client
     * @param message Message to send
     */
    public void sendMessage(String message) {
        if(mClientConnection != null) {
            mClientConnection.send(message);
        }
    }
}