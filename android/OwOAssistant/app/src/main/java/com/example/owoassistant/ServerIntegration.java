package com.example.owoassistant;

import android.animation.TimeInterpolator;
import android.util.Log;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.TextView;

import org.json.JSONObject;

import java.time.Duration;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class ServerIntegration {
    private Debug debug;
    private OkHttpClient client;
    private String server;
    private String apiKey;

    public ServerIntegration(Debug debug, String server, String apiKey) {
        client = new OkHttpClient.Builder()
                .connectTimeout(Duration.ofMillis(1500))
                .readTimeout(Duration.ofMinutes(2))
                .writeTimeout(Duration.ofMillis(1000))
                .build();
        this.debug = debug;
        this.server = server;
        this.apiKey = apiKey;
    }

    public void postQuery(String query, TextView responseView, View responseWindow) {
        JSONObject bodyJson = new JSONObject();
        try {
            bodyJson.put("query", query);
        } catch (Exception e) {
            debug.write("JSON Error");
        }


        MediaType JSON = MediaType.get("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(bodyJson.toString(), JSON);

        Request request = new Request.Builder()
                .url(server)
                .addHeader("x-api-key", apiKey)
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                debug.write("Error: Request to server failed; " + response.code());
            }

            responseView.setText(response.body().string());
            responseView.getLineCount();
            responseWindow.animate()
                    .scaleY(1f)
                    .translationY(160f)
                    .setDuration(150);


        } catch (Exception e) {
            debug.write("Error: Request to server failed; " + Log.getStackTraceString(e));
            e.printStackTrace();
        }
    }
}
