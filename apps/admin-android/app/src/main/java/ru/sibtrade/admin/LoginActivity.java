package ru.sibtrade.admin;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.content.Context;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LoginActivity extends Activity {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private EditText emailInput;
    private EditText passwordInput;
    private Button loginButton;
    private ProgressBar progress;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        String cookie = SecureStore.get(this, "session_cookie");
        if (cookie != null && !cookie.isEmpty()) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
            return;
        }
        renderLogin();
    }

    private void renderLogin() {
        int ink = Color.rgb(22, 37, 53), muted = Color.rgb(98, 114, 128), accent = Color.rgb(19, 99, 111);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(android.view.Gravity.CENTER_VERTICAL);
        root.setPadding(dp(28), dp(32), dp(28), dp(32));
        root.setBackgroundColor(Color.rgb(246, 248, 249));

        TextView brand = new TextView(this); brand.setText("СИБ-ТРЕЙД"); brand.setTextColor(accent); brand.setTextSize(13); brand.setLetterSpacing(.12f); brand.setTypeface(null, android.graphics.Typeface.BOLD);
        root.addView(brand);
        TextView title = new TextView(this); title.setText("Админ-панель"); title.setTextColor(ink); title.setTextSize(30); title.setTypeface(null, android.graphics.Typeface.BOLD); title.setPadding(0, dp(12), 0, dp(6));
        root.addView(title);
        TextView subtitle = new TextView(this); subtitle.setText("Войдите под учётной записью администратора."); subtitle.setTextColor(muted); subtitle.setTextSize(15);
        root.addView(subtitle);

        emailInput = field("Email", false); passwordInput = field("Пароль", true);
        root.addView(emailInput, marginTop(dp(28))); root.addView(passwordInput, marginTop(dp(12)));
        loginButton = new Button(this); loginButton.setText("Войти"); loginButton.setTextColor(Color.WHITE); loginButton.setBackgroundTintList(android.content.res.ColorStateList.valueOf(accent)); loginButton.setOnClickListener(v -> signIn());
        root.addView(loginButton, marginTop(dp(18)));
        progress = new ProgressBar(this); progress.setVisibility(View.GONE); root.addView(progress, marginTop(dp(14)));
        setContentView(root);
    }

    private EditText field(String hint, boolean password) {
        EditText input = new EditText(this);
        input.setSingleLine(true); input.setHint(hint); input.setTextSize(16); input.setPadding(dp(14), dp(12), dp(14), dp(12));
        input.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(184, 196, 204)));
        if (password) input.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);
        else { input.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS); input.setAutofillHints(View.AUTOFILL_HINT_EMAIL_ADDRESS); }
        return input;
    }

    private void signIn() {
        String email = emailInput.getText().toString().trim(); String password = passwordInput.getText().toString();
        if (email.isEmpty() || password.isEmpty()) { Toast.makeText(this, "Введите email и пароль", Toast.LENGTH_SHORT).show(); return; }
        ((InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(passwordInput.getWindowToken(), 0);
        loginButton.setEnabled(false); progress.setVisibility(View.VISIBLE);
        executor.execute(() -> {
            try {
                String cookie = AdminApi.login(email, password);
                SecureStore.put(this, "session_cookie", cookie);
                SecureStore.put(this, "admin_email", email);
                SecureStore.put(this, "cursor_at", "");
                SecureStore.put(this, "cursor_id", "");
                org.json.JSONObject baseline = AdminApi.get("/api/admin/mobile/notifications?initialize=true", cookie);
                org.json.JSONObject cursor = baseline.optJSONObject("cursor");
                if (cursor != null) { SecureStore.put(this, "cursor_at", cursor.optString("createdAt")); SecureStore.put(this, "cursor_id", cursor.optString("id")); }
                runOnUiThread(() -> { RequestNotifications.schedule(this); startActivity(new Intent(this, MainActivity.class)); finish(); });
            } catch (Exception error) {
                runOnUiThread(() -> { loginButton.setEnabled(true); progress.setVisibility(View.GONE); Toast.makeText(this, error.getMessage() == null ? "Не удалось войти" : error.getMessage(), Toast.LENGTH_LONG).show(); });
            }
        });
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private LinearLayout.LayoutParams marginTop(int top) { LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2); params.topMargin = top; return params; }
    @Override protected void onDestroy() { super.onDestroy(); executor.shutdown(); }
}
