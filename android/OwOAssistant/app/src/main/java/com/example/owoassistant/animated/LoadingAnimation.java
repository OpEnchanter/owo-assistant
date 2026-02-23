package com.example.owoassistant.animated;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.NonNull;

public class LoadingAnimation extends View {
    private Paint paint = new Paint();
    private float ballPos = 0f;
    private float ballRadius = 16f;
    private float animatedRadius = 16f;

    private ValueAnimator animator;

    public LoadingAnimation(Context context, AttributeSet attrs) {
        super(context, attrs);
        paint.setColor(Color.WHITE);

        animator = ValueAnimator.ofFloat(0f, 1f);
        animator.setDuration(312);
        animator.setRepeatCount(ValueAnimator.INFINITE);
        animator.setRepeatMode(ValueAnimator.REVERSE);

        animator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(@NonNull ValueAnimator animation) {
                float movementFraction = (float) animation.getAnimatedValue();
                ballPos = ballRadius + movementFraction * (getWidth() - 2 * ballRadius);
                animatedRadius = ballRadius + (1 - Math.abs((movementFraction - 0.5f)*2)) * 12.0f;
                invalidate();
            }
        });
        animator.start();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float y = getHeight() / 2;
        canvas.drawCircle(ballPos, y, animatedRadius, paint);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        animator.cancel();
    }
}
