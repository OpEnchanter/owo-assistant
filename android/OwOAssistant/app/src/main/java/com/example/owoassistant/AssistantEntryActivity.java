package com.example.owoassistant;

import static android.view.View.TEXT_ALIGNMENT_CENTER;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okio.BufferedSink;

import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.text.Layout;
import android.util.Log;
import android.view.View;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsAnimationCompat;
import androidx.core.view.WindowInsetsCompat;

import org.json.JSONObject;

import java.io.IOException;
import java.util.List;

public class AssistantEntryActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.overlay);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarContrastEnforced(false);

        SharedPreferences prefs = getSharedPreferences("owo", MODE_PRIVATE);

        View userInputContainer = findViewById(R.id.userInteraction);
        final float density = userInputContainer.getResources().getDisplayMetrics().density;

        final float gap = 20f;

        userInputContainer.setTranslationY(-(gap * density));

        ViewCompat.setWindowInsetsAnimationCallback(
                userInputContainer,
                new WindowInsetsAnimationCompat.Callback(
                        WindowInsetsAnimationCompat.Callback.DISPATCH_MODE_CONTINUE_ON_SUBTREE
                ) {
                    @Override
                    public WindowInsetsCompat onProgress(
                            WindowInsetsCompat insets,
                            List<WindowInsetsAnimationCompat> runningAnimations
                    ) {
                        int imeBottom = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;

                        int translation = 0;

                        if (imeBottom > 0) {
                            translation = imeBottom;
                        }

                        float treatedIme = Math.max(0f, translation - (gap * density));

                        // Move the container up, with your dynamic gap behavior
                        userInputContainer.setTranslationY(-(treatedIme + (gap * density)));

                        return insets;
                    }
                }
        );

        userInputContainer.setOnClickListener(l -> {});

        View backdrop = findViewById(R.id.backdrop);
        backdrop.setOnClickListener(l -> { finish(); });

        View sendButton = findViewById(R.id.button);
        TextView input = findViewById(R.id.query);
        TextView debugView = findViewById(R.id.textView);
        TextView debugLabel = findViewById(R.id.debugLabel);

        Debug debug = new Debug(debugView);
        ServerIntegration serverIntegration = new ServerIntegration(debug, prefs.getString("backendUrl", ""));

        String[] hints = {
                "Ask me anything!",
                "Start typing...",
                "How can I assist you?",
                "Welcome back!",
        };
        input.setHint(hints[(int) Math.round(Math.random() * (hints.length - 1))]);

        debugView.setTextAlignment(TEXT_ALIGNMENT_CENTER);
        debugView.setMovementMethod(new android.text.method.ScrollingMovementMethod());

        if (!prefs.getBoolean("debug", false)) {
            debugView.setVisibility(View.GONE);
            debugLabel.setVisibility(View.GONE);
        }

        debugView.setText("Backend URL: " + prefs.getString("backendUrl", ""));

        sendButton.setOnClickListener(l -> {
            String query = input.getText().toString();
            debug.write("User Inputted: " + query);
            input.setText("");

            // Make HTTP request
            new Thread(() -> { serverIntegration.postQuery(query); }).start();
        });
    }

    @Override
    protected void onStop() {
        super.onStop();
        finish();
    }


}
