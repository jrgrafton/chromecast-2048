/*
 * Copyright (C) 2014 Google Inc. All Rights Reserved. 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at 
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and 
 * limitations under the License.
 */

package com.twjg.chromecast2048.activities;

import android.graphics.Canvas;
import android.graphics.Point;
import android.graphics.drawable.ColorDrawable;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.support.v4.view.MenuItemCompat;
import android.support.v7.app.ActionBar;
import android.support.v7.app.ActionBarActivity;
import android.support.v7.app.MediaRouteActionProvider;
import android.support.v7.media.MediaRouteSelector;
import android.support.v7.media.MediaRouter;
import android.support.v7.media.MediaRouter.RouteInfo;
import android.text.format.Formatter;
import android.util.Log;
import android.view.Display;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.SeekBar;
import android.widget.TextView;

import com.twjg.chromecast2048.R;
import com.google.android.gms.cast.ApplicationMetadata;
import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.Cast.ApplicationConnectionResult;
import com.google.android.gms.cast.Cast.MessageReceivedCallback;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.CastMediaControlIntent;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.twjg.chromecast2048.views.DragTriggerView;
import com.twjg.chromecast2048.views.events.DragTriggerEvent;
import com.twjg.chromecast2048.websocket.WebSocketServer2048;

import java.io.IOException;
import java.util.ArrayList;

/**
 * Main activity to send messages to the receiver.
 */
public class MainActivity extends ActionBarActivity {

    private static final String TAG = MainActivity.class.getSimpleName();

    private static final int REQUEST_CODE = 1;

    private MediaRouter mMediaRouter;
    private MediaRouteSelector mMediaRouteSelector;
    private MediaRouter.Callback mMediaRouterCallback;
    private CastDevice mSelectedDevice;
    private GoogleApiClient mApiClient;
    private Cast.Listener mCastListener;
    private ConnectionCallbacks mConnectionCallbacks;
    private ConnectionFailedListener mConnectionFailedListener;
    private boolean mApplicationStarted;
    private boolean mWaitingForReconnect;
    private String mSessionId;

    // Custom message channels
    private Chromecast2048Channel mChromecast2048ChannelGame;

    // Variables for drag functionality
    private int mDragThreshold;
    private Point mDragStart;
    private Canvas mDragCanvas;

    // Raw websocket functionality
    private WebSocketServer2048 mWebSocketServer2048;
    private Chromecast2048Channel mChromecast2048ChannelSocket;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        ActionBar actionBar = getSupportActionBar();
        actionBar.setBackgroundDrawable(new ColorDrawable(
                android.R.color.transparent));

        // Configure Cast device discovery
        mMediaRouter = MediaRouter.getInstance(getApplicationContext());
        mMediaRouteSelector = new MediaRouteSelector.Builder()
                .addControlCategory(
                        CastMediaControlIntent.categoryForCast(getResources()
                                .getString(R.string.app_id))).build();
        mMediaRouterCallback = new MyMediaRouterCallback();

        // Create new WebSocketServer
        this.mWebSocketServer2048 = new WebSocketServer2048();

        // Attach button listeners
        this.attachObservers();
    }

    private void attachObservers() {
        this.attachButtonListeners();
        this.attachDragListeners();
    }

    private void seekbarUpdated() {
        SeekBar seekbar = (SeekBar) findViewById(R.id.seekBar);
        TextView seekBarValue = (TextView) findViewById(R.id.seekBarValue);
        DragTriggerView dragArea = (DragTriggerView) findViewById(R.id.dragArea);

        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        float width = display.getWidth();
        float progress = seekbar.getProgress();
        this.mDragThreshold = Math.round(width * (progress / 100.0f));
        seekBarValue.setText("" + this.mDragThreshold + "px");
        dragArea.setDragThreshold(this.mDragThreshold);
    }

    private void attachDragListeners() {
        // Capture all UI elements
        SeekBar seekbar = (SeekBar) findViewById(R.id.seekBar);
        final DragTriggerView dragArea = (DragTriggerView) findViewById(R.id.dragArea);

        // Update seek bar with default values
        this.seekbarUpdated();

        // Attach observer to seekBar
        seekbar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int i, boolean b) {
                MainActivity.this.seekbarUpdated();
            }
            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}
            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });

        // Attach observer for dragTrigger to dragArea
        dragArea.setOnDragTriggerListener(new DragTriggerView.OnDragTriggerListener() {
            @Override
            public void onTrigger(DragTriggerEvent e) {
                Log.d(TAG, "Drag trigger: " + e.getAction());
                MainActivity.this.sendMessage("" + e.getAction(), MainActivity.this.mChromecast2048ChannelGame);
            }
        });
    }
    /**
     * Sends commands over to Chromecast
     */
    private void attachButtonListeners() {
        ArrayList <Button> buttons = new ArrayList<Button>(5);
        buttons.add((Button) findViewById(R.id.upButton));
        buttons.add((Button) findViewById(R.id.rightButton));
        buttons.add((Button) findViewById(R.id.downButton));
        buttons.add((Button) findViewById(R.id.leftButton));
        buttons.add((Button) findViewById(R.id.resetButton));

        for(Button button : buttons) {
            button.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View v) {
                    Button button = (Button) v;
                    MainActivity.this.sendMessage((String) button.getHint(), MainActivity.this.mChromecast2048ChannelGame);
                }
            });
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Start media router discovery
        mMediaRouter.addCallback(mMediaRouteSelector, mMediaRouterCallback,
                MediaRouter.CALLBACK_FLAG_PERFORM_ACTIVE_SCAN);
    }

    @Override
    protected void onPause() {
        if (isFinishing()) {
            // End media router discovery
            mMediaRouter.removeCallback(mMediaRouterCallback);
        }
        super.onPause();
    }

    @Override
    public void onDestroy() {
        teardown();
        super.onDestroy();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        super.onCreateOptionsMenu(menu);
        getMenuInflater().inflate(R.menu.main, menu);
        MenuItem mediaRouteMenuItem = menu.findItem(R.id.media_route_menu_item);
        MediaRouteActionProvider mediaRouteActionProvider = (MediaRouteActionProvider) MenuItemCompat
                .getActionProvider(mediaRouteMenuItem);
        // Set the MediaRouteActionProvider selector for device discovery.
        mediaRouteActionProvider.setRouteSelector(mMediaRouteSelector);
        return true;
    }

    /**
     * Callback for MediaRouter events
     */
    private class MyMediaRouterCallback extends MediaRouter.Callback {

        @Override
        public void onRouteSelected(MediaRouter router, RouteInfo info) {
            Log.d(TAG, "onRouteSelected");
            // Handle the user route selection.
            mSelectedDevice = CastDevice.getFromBundle(info.getExtras());

            launchReceiver();
        }

        @Override
        public void onRouteUnselected(MediaRouter router, RouteInfo info) {
            Log.d(TAG, "onRouteUnselected: info=" + info);
            teardown();
            mSelectedDevice = null;
        }
    }

    /**
     * Start the receiver app
     */
    private void launchReceiver() {
        try {
            mCastListener = new Cast.Listener() {

                @Override
                public void onApplicationDisconnected(int errorCode) {
                    Log.d(TAG, "application has stopped");
                    teardown();
                }

            };
            // Connect to Google Play services
            mConnectionCallbacks = new ConnectionCallbacks();
            mConnectionFailedListener = new ConnectionFailedListener();
            Cast.CastOptions.Builder apiOptionsBuilder = Cast.CastOptions
                    .builder(mSelectedDevice, mCastListener);
            mApiClient = new GoogleApiClient.Builder(this)
                    .addApi(Cast.API, apiOptionsBuilder.build())
                    .addConnectionCallbacks(mConnectionCallbacks)
                    .addOnConnectionFailedListener(mConnectionFailedListener)
                    .build();

            mApiClient.connect();
        } catch (Exception e) {
            Log.e(TAG, "Failed launchReceiver", e);
        }
    }

    /**
     * Google Play services callbacks
     */
    private class ConnectionCallbacks implements
            GoogleApiClient.ConnectionCallbacks {
        @Override
        public void onConnected(Bundle connectionHint) {
            Log.d(TAG, "onConnected");

            if (mApiClient == null) {
                // We got disconnected while this runnable was pending
                // execution.
                return;
            }

            try {
                if (mWaitingForReconnect) {
                    mWaitingForReconnect = false;

                    // Check if the receiver app is still running
                    if ((connectionHint != null)
                            && connectionHint
                            .getBoolean(Cast.EXTRA_APP_NO_LONGER_RUNNING)) {
                        Log.d(TAG, "App  is no longer running");
                        teardown();
                    } else {
                        // Re-create the custom message channel
                        try {
                            Cast.CastApi.setMessageReceivedCallbacks(
                                    mApiClient,
                                    mChromecast2048ChannelGame.getNamespace(),
                                    mChromecast2048ChannelGame);
                        } catch (IOException e) {
                            Log.e(TAG, "Exception while creating channel", e);
                        }
                    }
                } else {
                    // Launch the receiver app
                    Cast.CastApi
                            .launchApplication(mApiClient,
                                    getString(R.string.app_id), false)
                            .setResultCallback(
                                    new ResultCallback<Cast.ApplicationConnectionResult>() {
                                        @Override
                                        public void onResult(
                                                ApplicationConnectionResult result) {
                                            Status status = result.getStatus();
                                            Log.d(TAG,
                                                    "ApplicationConnectionResultCallback.onResult: statusCode"
                                                            + status.getStatusCode());
                                            if (status.isSuccess()) {
                                                ApplicationMetadata applicationMetadata = result
                                                        .getApplicationMetadata();
                                                mSessionId = result
                                                        .getSessionId();
                                                String applicationStatus = result
                                                        .getApplicationStatus();
                                                boolean wasLaunched = result
                                                        .getWasLaunched();
                                                Log.d(TAG,
                                                        "application name: "
                                                                + applicationMetadata
                                                                .getName()
                                                                + ", status: "
                                                                + applicationStatus
                                                                + ", sessionId: "
                                                                + mSessionId
                                                                + ", wasLaunched: "
                                                                + wasLaunched);
                                                mApplicationStarted = true;

                                                // Create the game custom message channel
                                                mChromecast2048ChannelGame = new Chromecast2048Channel(getString(R.string.namespace_game));
                                                try {
                                                    Cast.CastApi
                                                            .setMessageReceivedCallbacks(
                                                                    mApiClient,
                                                                    mChromecast2048ChannelGame
                                                                            .getNamespace(),
                                                                    mChromecast2048ChannelGame
                                                            );
                                                } catch (IOException e) {
                                                    Log.e(TAG,
                                                            "Exception while creating game channel",
                                                            e);
                                                }

                                                // Create the socket custom message channel
                                                mChromecast2048ChannelSocket = new Chromecast2048Channel(getString(R.string.namespace_game));
                                                try {
                                                    Cast.CastApi
                                                            .setMessageReceivedCallbacks(
                                                                    mApiClient,
                                                                    mChromecast2048ChannelSocket
                                                                            .getNamespace(),
                                                                    mChromecast2048ChannelSocket
                                                            );
                                                    // Send message with IP and PORT to trigger socketConnection back to server
                                                    WifiManager wm = (WifiManager) getSystemService(WIFI_SERVICE);
                                                    String ip = Formatter.formatIpAddress(wm.getConnectionInfo().getIpAddress());
                                                    MainActivity.this.sendMessage(ip + ":" + WebSocketServer2048.SOCKET
                                                            , MainActivity.this.mChromecast2048ChannelSocket);
                                                } catch (IOException e) {
                                                    Log.e(TAG,
                                                            "Exception while creating socket channel",
                                                            e);
                                                }
                                            } else {
                                                Log.e(TAG,
                                                        "application could not launch");
                                                teardown();
                                            }
                                        }
                                    });
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to launch application", e);
            }
        }

        @Override
        public void onConnectionSuspended(int cause) {
            Log.d(TAG, "onConnectionSuspended");
            mWaitingForReconnect = true;
        }
    }

    /**
     * Google Play services callbacks
     */
    private class ConnectionFailedListener implements
            GoogleApiClient.OnConnectionFailedListener {
        @Override
        public void onConnectionFailed(ConnectionResult result) {
            Log.e(TAG, "onConnectionFailed ");

            teardown();
        }
    }

    /**
     * Tear down the connection to the receiver
     */
    private void teardown() {
        Log.d(TAG, "teardown");
        if (mApiClient != null) {
            if (mApplicationStarted) {
                if (mApiClient.isConnected()) {
                    try {
                        Cast.CastApi.stopApplication(mApiClient, mSessionId);
                        if (mChromecast2048ChannelGame != null) {
                            Cast.CastApi.removeMessageReceivedCallbacks(
                                    mApiClient,
                                    mChromecast2048ChannelGame.getNamespace());
                            mChromecast2048ChannelGame = null;
                        }
                    } catch (IOException e) {
                        Log.e(TAG, "Exception while removing channel", e);
                    }
                    mApiClient.disconnect();
                }
                mApplicationStarted = false;
            }
            mApiClient = null;
        }
        mSelectedDevice = null;
        mWaitingForReconnect = false;
        mSessionId = null;
    }

    /**
     * Send a text message to the receiver
     *
     * @param message
     */
    private void sendMessage(String message, Chromecast2048Channel channel) {
        if (mApiClient != null && channel != null) {
            try {
                Cast.CastApi.sendMessage(mApiClient,
                        channel.getNamespace(), message)
                        .setResultCallback(new ResultCallback<Status>() {
                            @Override
                            public void onResult(Status result) {
                                if (!result.isSuccess()) {
                                    Log.e(TAG, "Sending message failed");
                                }
                            }
                        });
            } catch (Exception e) {
                Log.e(TAG, "Exception while sending message", e);
            }
        }
    }

    /**
     * Connect to raw Websocket on
     */

    /**
     * Custom message channel
     */
    class Chromecast2048Channel implements MessageReceivedCallback {

        private String mNamespace;

        public Chromecast2048Channel(String namespace) {
            this.mNamespace = namespace;
        }

        /**
         * @return custom namespace
         */
        public String getNamespace() {
            return this.mNamespace;
        }

        /*
         * Receive message from the receiver app
         */
        @Override
        public void onMessageReceived(CastDevice castDevice, String namespace,
                                      String message) {
            Log.d(TAG, "onMessageReceived: " + message);
        }

    }

}