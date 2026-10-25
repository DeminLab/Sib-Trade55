package ru.sibtrade.admin;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

final class AdminApi {
    static final String BASE_URL = "https://sib-trade55.ru";
    private AdminApi() {}

    static String login(String email, String password) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(BASE_URL + "/api/auth/login").openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(12000);
        connection.setReadTimeout(12000);
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        byte[] body = new JSONObject().put("email", email).put("password", password).toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream output = connection.getOutputStream()) { output.write(body); }
        int status = connection.getResponseCode();
        if (status < 200 || status >= 300) {
            String message = "Не удалось войти. Проверьте email и пароль.";
            try (InputStream input = connection.getErrorStream()) {
                if (input != null) {
                    JSONObject response = new JSONObject(readAll(input));
                    message = response.optString("message", message);
                }
            } catch (Exception ignored) {}
            connection.disconnect();
            throw new IllegalStateException(message);
        }
        String cookie = null;
        for (java.util.Map.Entry<String, java.util.List<String>> entry : connection.getHeaderFields().entrySet()) {
            if (entry.getKey() == null || !"Set-Cookie".equalsIgnoreCase(entry.getKey())) continue;
            for (String header : entry.getValue()) if (header.startsWith("sib_trade_session=")) {
                cookie = header.substring("sib_trade_session=".length()).split(";", 2)[0];
                break;
            }
            if (cookie != null) break;
        }
        connection.disconnect();
        if (cookie == null || cookie.isEmpty()) throw new IllegalStateException("Сервер не вернул сессию администратора.");
        return cookie;
    }

    static JSONObject get(String path, String cookie) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(BASE_URL + path).openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(10000);
        connection.setRequestProperty("Cookie", "sib_trade_session=" + cookie);
        connection.setRequestProperty("Accept", "application/json");
        int status = connection.getResponseCode();
        InputStream stream = status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream();
        String body = stream == null ? "{}" : readAll(stream);
        connection.disconnect();
        if (status < 200 || status >= 300) throw new IllegalStateException("Сессия истекла или сервер недоступен (" + status + ").");
        return new JSONObject(body);
    }

    private static String readAll(InputStream input) throws Exception {
        try (InputStream source = input; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int count;
            while ((count = source.read(buffer)) != -1) output.write(buffer, 0, count);
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }
}
