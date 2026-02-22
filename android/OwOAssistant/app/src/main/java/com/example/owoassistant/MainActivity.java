package com.example.owoassistant;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Switch;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        if(ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED){
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, 1);
        }

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

        TextView apiKey = findViewById(R.id.apiKey);
        apiKey.setText(prefs.getString("apiKey", ""));


        Button save = findViewById(R.id.save);
        save.setOnClickListener(v -> {
            getSharedPreferences("owo", MODE_PRIVATE)
                    .edit()
                    .putString("backendUrl", backendUrlInput.getText().toString())
                    .putString("apiKey", apiKey.getText().toString())
                    .putBoolean("debug", debugSwitch.isChecked())
                    .apply();
            save.setBackgroundTintList(ColorStateList.valueOf(0xff0aefab));
            save.postDelayed(() -> { save.setBackgroundTintList(ColorStateList.valueOf(0xff7f7f7f)); }, 1500);
        });
    }
}