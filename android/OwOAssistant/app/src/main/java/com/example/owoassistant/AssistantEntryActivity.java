package com.example.owoassistant;

import static android.view.View.TEXT_ALIGNMENT_CENTER;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okio.BufferedSink;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.text.Layout;
import android.util.Log;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContract;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsAnimationCompat;
import androidx.core.view.WindowInsetsCompat;

import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class AssistantEntryActivity extends AppCompatActivity {

    private final ActivityResultLauncher<String> permissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(),
                    granted -> { if (granted) startListening(); });

    private SpeechRecognizer speech;
    private boolean isListening;
    String lastPartialText = "";

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

        userInputContainer.setOnClickListener(l -> {
        });

        View backdrop = findViewById(R.id.backdrop);
        backdrop.setOnClickListener(l -> {
            finish();
        });

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
            new Thread(() -> {
                serverIntegration.postQuery(query);
            }).start();
        });

        View voiceButton = findViewById(R.id.speechButton);

        speech = SpeechRecognizer.createSpeechRecognizer(this);
        speech.setRecognitionListener(new RecognitionListener() {
            public void onResults(Bundle results) {
                String finalText = results.getStringArrayList(
                        SpeechRecognizer.RESULTS_RECOGNITION).get(0);
                input.setText(finalText);
                lastPartialText = "";

                String query = input.getText().toString();
                debug.write("User Inputted: " + query);
                input.setText("");

                // Make HTTP request
                new Thread(() -> {
                    serverIntegration.postQuery(query);
                }).start();

                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO);
            }
            public void onError(int error) {
                voiceButton.setBackgroundTintList(ColorStateList.valueOf(0xFF2C2C2C));
                input.setHint("Type...");
            }
            // Empty implementations for other required methods
            public void onReadyForSpeech(Bundle params) {}
            public void onBeginningOfSpeech() {}
            public void onRmsChanged(float rmsdB) {}
            public void onBufferReceived(byte[] buffer) {}
            public void onEndOfSpeech() {}

            public void onPartialResults(Bundle partialResults) {
                ArrayList<String> matches = partialResults.getStringArrayList(
                        SpeechRecognizer.RESULTS_RECOGNITION);

                if (matches != null && !matches.isEmpty()) {
                    String newPartialText = matches.get(0);

                    // Only update if text changed
                    if (!newPartialText.equals(lastPartialText)) {
                        input.setText(newPartialText);
                        lastPartialText = newPartialText;

                        // Scroll to bottom if using ScrollView
                        // scrollView.fullScroll(View.FOCUS_DOWN);
                    }
                }
            }

            public void onEvent(int eventType, Bundle params) {}
        });

        voiceButton.setOnClickListener(v -> {
            toggleListening(input, voiceButton);
        });

        toggleListening(input, voiceButton);
    }

    private void toggleListening(TextView input, View voiceButton) {
        if (!isListening) {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO);
            input.setHint("Speak...");
            voiceButton.setBackgroundTintList(ColorStateList.valueOf(0xFF00EADF));
        } else {
            speech.stopListening();
            input.setHint("Type...");
            voiceButton.setBackgroundTintList(ColorStateList.valueOf(0xFF2C2C2C));
        }

        isListening = !isListening;
    }

    private void startListening() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        speech.startListening(intent);
    }

    @Override
    protected void onStop() {
        super.onStop();
        speech.destroy();
        finish();
    }
}