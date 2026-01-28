package com.example.owoassistant;

import android.util.Log;
import android.widget.TextView;

import org.json.JSONObject;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class ServerIntegration {
    private Debug debug;
    private OkHttpClient client;
    private String server;

    public ServerIntegration(Debug debug, String server) {
        client = new OkHttpClient();
        this.debug = debug;
        this.server = server;
    }

    public void postQuery(String query) {
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
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                debug.write("Error: Request to server failed; " + response.code());
            }
            debug.write(response.body().string());
        } catch (Exception e) {
            debug.write("Error: Request to server failed; " + Log.getStackTraceString(e));
            e.printStackTrace();
        }
    }
}
