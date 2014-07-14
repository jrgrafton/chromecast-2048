package com.twjg.chromecast2048.views;

import android.app.Activity;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Point;
import android.util.AttributeSet;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.twjg.chromecast2048.R;
import com.twjg.chromecast2048.activities.MainActivity;
import com.twjg.chromecast2048.views.events.DragTriggerEvent;

/**
 * Custom view that allows events to be triggered after a drag has reached
 * a certain threshold
 */
public class DragTriggerView extends View {
    // Static fields
    private static final String TAG = MainActivity.class.getSimpleName();
    private static final int CIRCLE_RADIUS = 75;
    private static final int LINE_WIDTH = 5;

    // Private fields which have getters / setters
    private int mDragThreshold;
    private OnDragTriggerListener mOnDragTriggerListener;

    // Private local fields
    private Point mStartDragPoint;
    private Point mCurrentDragPoint;

    private Paint mCirclePaint;
    private Paint mLinePaint;

    public DragTriggerView(Context context) {
        super(context);
        init(null, 0);
    }

    public DragTriggerView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(attrs, 0);
    }

    public DragTriggerView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        init(attrs, defStyle);
    }

    public void init(AttributeSet attrs, int defStyle) {
        // Setup paint for draw operations
        Paint circlePaint = new Paint();
        circlePaint.setColor(Color.RED);
        circlePaint.setStyle(Paint.Style.FILL);
        this.mCirclePaint = circlePaint;

        Paint linePaint = new Paint();
        linePaint.setColor(Color.BLACK);
        linePaint.setStyle(Paint.Style.STROKE);
        linePaint.setStrokeWidth(LINE_WIDTH);
        this.mLinePaint = linePaint;
    }

    public int getDragThreshold() {
        return mDragThreshold;
    }

    public void setDragThreshold(int mDragThreshold) {
        this.mDragThreshold = mDragThreshold;
    }

    public void setOnDragTriggerListener(OnDragTriggerListener mDragTriggerListener) {
        this.mOnDragTriggerListener = mDragTriggerListener;
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        Log.d(TAG, e.toString());
        switch(e.getAction()) {
            case MotionEvent.ACTION_DOWN:
                this.onActionDown(e);
            break;
            case MotionEvent.ACTION_UP:
                this.onActionUp(e);
            break;
            case MotionEvent.ACTION_MOVE:
                this.onActionMove(e);
            break;
            default:
            break;
        }
        return true;
    }

    private void onActionDown(MotionEvent e) {
        this.mStartDragPoint = new Point((int) e.getX(), (int) e.getY());
        this.mCurrentDragPoint = this.mStartDragPoint;
        invalidate();
    }

    private void onActionUp(MotionEvent e) {
        this.mStartDragPoint = null;
        invalidate();
    }

    private void onActionMove(MotionEvent e) {
        if(this.mStartDragPoint == null) {
            return;
        } else {
            // Set current location
            this.mCurrentDragPoint = new Point((int) e.getX(), (int) e.getY());

            // Get x and y drag distance
            int yDiff = this.mStartDragPoint.y - (int) this.mCurrentDragPoint.y;
            int xDiff = this.mStartDragPoint.x - (int) this.mCurrentDragPoint.x;

            int up = (yDiff > 0) ? yDiff : 0;
            int down = (yDiff > 0) ? 0 : Math.abs(yDiff);
            int left = (xDiff > 0) ? xDiff : 0;
            int right = (xDiff > 0) ? 0 : Math.abs(xDiff);

            // Update debug text
            TextView debugText = (TextView) ((ViewGroup)this.getParent()).findViewById(R.id.debugText);
            if(debugText != null) {
                debugText.setText(String.format("[up: %d] [right: %d] [down: %d] [left: %d]",
                        new Object[]{up, right, left, down}));
            }

            // Possibly create dragTrigger event
            DragTriggerEvent dragTriggerEvent = null;
            if(up >= this.mDragThreshold) {
                dragTriggerEvent = new DragTriggerEvent(DragTriggerEvent.ACTION_DRAG_UP);
            }
            else if(right >= this.mDragThreshold) {
                dragTriggerEvent = new DragTriggerEvent(DragTriggerEvent.ACTION_DRAG_RIGHT);
            }
            else if(down >= this.mDragThreshold) {
                dragTriggerEvent = new DragTriggerEvent(DragTriggerEvent.ACTION_DRAG_DOWN);
            }
            else if(left >= this.mDragThreshold) {
                dragTriggerEvent = new DragTriggerEvent(DragTriggerEvent.ACTION_DRAG_LEFT);
            }

            if(dragTriggerEvent != null) {
                this.mStartDragPoint = null; // Prevent further events being triggered in one drag
                this.mOnDragTriggerListener.onTrigger(dragTriggerEvent);
            }

            // Trigger repaint
            invalidate();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.dispatchDraw(canvas);

        if(this.mStartDragPoint == null) {
            return;
        } else {
            // Draw a line from start location to current location
            canvas.drawLine(this.mStartDragPoint.x, this.mStartDragPoint.y,
                    this.mCurrentDragPoint.x, this.mCurrentDragPoint.y, this.mLinePaint);

            // Draw a circle on the current location
            canvas.drawCircle(this.mCurrentDragPoint.x, this.mCurrentDragPoint.y,
                    CIRCLE_RADIUS, this.mCirclePaint);
        }
    }

    /**
     * Allows anonymous class to be attached for drag trigger events
     */
    public static interface OnDragTriggerListener {
        void onTrigger(DragTriggerEvent e);
    }
}
