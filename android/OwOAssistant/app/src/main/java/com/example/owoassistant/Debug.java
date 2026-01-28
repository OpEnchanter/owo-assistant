package com.example.owoassistant;

import android.text.Layout;
import android.widget.TextView;

public class Debug {
    private TextView debugView;

    public Debug(TextView view) {
        this.debugView = view;
    }

    public void write(String text) {
        debugView.setText(debugView.getText() + "\n" + text);
        Layout layout = debugView.getLayout();
        if (layout == null) return;
        int scrollAmount = layout.getLineTop(debugView.getLineCount()) - debugView.getHeight();
        debugView.scrollTo(0, Math.max(scrollAmount, 0));
    }
}
