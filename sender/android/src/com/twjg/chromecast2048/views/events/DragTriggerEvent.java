package com.twjg.chromecast2048.views.events;

/**
 * Created by jrgrafton on 7/14/14.
 */
public class DragTriggerEvent {
    public static final int ACTION_DRAG_UP = 0;
    public static final int ACTION_DRAG_RIGHT = 1;
    public static final int ACTION_DRAG_DOWN = 2;
    public static final int ACTION_DRAG_LEFT = 3;

    private int mAction;

    public DragTriggerEvent(int mAction) {
        this.mAction = mAction;
    }

    public int getAction() {
        return mAction;
    }
}
