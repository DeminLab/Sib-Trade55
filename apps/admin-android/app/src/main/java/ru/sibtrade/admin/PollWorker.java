package ru.sibtrade.admin;

import android.content.Context;

import androidx.work.Worker;
import androidx.work.WorkerParameters;

public final class PollWorker extends Worker {
    public PollWorker(Context context, WorkerParameters params) { super(context, params); }

    @Override public Result doWork() {
        try {
            RequestNotifications.poll(getApplicationContext());
            return Result.success();
        } catch (Exception error) {
            if (error.getMessage() != null && error.getMessage().contains("(401)")) {
                Context context = getApplicationContext();
                SecureStore.clear(context);
                RequestNotifications.cancel(context);
                RequestNotifications.sessionExpired(context);
                return Result.success();
            }
            return Result.retry();
        }
    }
}
