package ru.sibtrade.admin;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.work.WorkManager;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;

import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

final class RequestNotifications {
    private static final String CHANNEL = "customer_requests";
    private static final String WORK_NAME = "admin-request-notifications";
    private RequestNotifications() {}

    static void schedule(Context context) {
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(PollWorker.class, 15, TimeUnit.MINUTES)
                .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build();
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request);
    }

    static void cancel(Context context) { WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME); }

    static void sessionExpired(Context context) {
        show(context, "Нужен повторный вход", "Откройте приложение и войдите снова", "/admin", "session-expired");
    }

    static void poll(Context context) throws Exception {
        String cookie = SecureStore.get(context, "session_cookie");
        if (cookie == null || cookie.isEmpty()) return;
        String afterAt = SecureStore.get(context, "cursor_at");
        String afterId = SecureStore.get(context, "cursor_id");
        String path;
        if (afterAt == null) {
            path = "/api/admin/mobile/notifications?initialize=true";
        } else {
            path = "/api/admin/mobile/notifications?afterAt="
                    + URLEncoder.encode(afterAt, StandardCharsets.UTF_8.name())
                    + "&afterId=" + URLEncoder.encode(afterId == null ? "" : afterId, "UTF-8");
        }
        JSONObject response = AdminApi.get(path, cookie);
        JSONArray events = response.optJSONArray("events");
        if (events != null) {
            for (int i = 0; i < events.length(); i++) {
                JSONObject event = events.getJSONObject(i);
                show(context, event.optString("title", "Новая заявка"), event.optString("requestNumber", "Откройте админку"), event.optString("url", "/admin"), event.optString("id", ""));
            }
        }
        JSONObject cursor = response.optJSONObject("cursor");
        if (cursor != null) {
            SecureStore.put(context, "cursor_at", cursor.optString("createdAt"));
            SecureStore.put(context, "cursor_id", cursor.optString("id"));
        }
    }

    private static void show(Context context, String title, String number, String url, String eventId) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(new NotificationChannel(CHANNEL, "Заявки клиентов", NotificationManager.IMPORTANCE_HIGH));
        }
        Intent open = new Intent(context, MainActivity.class).putExtra("admin_path", url).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending = PendingIntent.getActivity(context, eventId.hashCode(), open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        manager.notify(eventId.hashCode(), new NotificationCompat.Builder(context, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(number)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(number))
                .setAutoCancel(true)
                .setContentIntent(pending)
                .build());
    }

}
