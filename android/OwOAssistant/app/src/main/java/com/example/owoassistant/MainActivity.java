package com.example.owoassistant;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Switch;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;

public class MainActivity extends AppCompatActivity {
    private boolean pendingStartOverlay = false;

    private static final int REQ_OVERLAY = 1234;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarContrastEnforced(false);

        SharedPreferences prefs = getSharedPreferences("owo", MODE_PRIVATE);
        String backendUrl = prefs.getString("backendUrl", "");

        TextView backendUrlInput = findViewById(R.id.backendUrl);
        backendUrlInput.setText(backendUrl);

        Switch debugSwitch = findViewById(R.id.debugSwitch);
        debugSwitch.setChecked(prefs.getBoolean("debug", false));

        Button start = findViewById(R.id.startOverlay);

        start.setOnClickListener(v -> {
            startActivity(new Intent(this, AssistantEntryActivity.class));
        });


        Button save = findViewById(R.id.save);
        save.setOnClickListener(v -> {
            getSharedPreferences("owo", MODE_PRIVATE)
                    .edit()
                    .putString("backendUrl", backendUrlInput.getText().toString())
                    .putBoolean("debug", debugSwitch.isChecked())
                    .apply();
            save.setBackgroundTintList(ColorStateList.valueOf(0xff0aefab));
            save.postDelayed(() -> { save.setBackgroundTintList(ColorStateList.valueOf(0xff00b3db)); }, 1500);
        });
    }
}