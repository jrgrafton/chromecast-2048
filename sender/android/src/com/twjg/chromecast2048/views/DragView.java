package com.twjg.chromecast2048.views;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.drawable.Drawable;
import android.text.TextPaint;
import android.util.AttributeSet;
import android.util.Log;
import android.view.DragEvent;
import android.view.MotionEvent;
import android.view.View;
import android.widget.FrameLayout;

import com.twjg.chromecast2048.R;
import com.twjg.chromecast2048.activities.MainActivity;

/**
 * TODO: document your custom view class.
 */
public class DragView extends FrameLayout {
    private static final String TAG = MainActivity.class.getSimpleName();

    public DragView(Context context) {
        super(context);
        init(null, 0);
    }

    public DragView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(attrs, 0);
    }

    public DragView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        init(attrs, defStyle);
    }

    private void init(AttributeSet attrs, int defStyle) {}

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        Log.d(TAG, e.toString());
        invalidate();
        return true;
    }

    @Override
    protected void dispatchDraw(Canvas canvas) {
        super.dispatchDraw(canvas);

    }
}
