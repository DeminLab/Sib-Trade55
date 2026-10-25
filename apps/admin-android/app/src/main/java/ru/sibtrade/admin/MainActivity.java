package ru.sibtrade.admin;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private WebView webView;
    private Runnable foregroundPoll;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        String cookie = SecureStore.get(this, "session_cookie");
        if (cookie == null || cookie.isEmpty()) { openLogin(); return; }
        buildWebView(cookie);
        askNotificationPermission();
        RequestNotifications.schedule(this);
    }

    private void buildWebView(String cookie) {
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.WHITE);
        LinearLayout toolbar = new LinearLayout(this); toolbar.setGravity(android.view.Gravity.CENTER_VERTICAL); toolbar.setPadding(dp(16), 0, dp(8), 0); toolbar.setBackgroundColor(Color.rgb(22, 37, 53));
        android.widget.TextView title = new android.widget.TextView(this); title.setText("СИБ-ТРЕЙД  ·  Админ"); title.setTextColor(Color.WHITE); title.setTextSize(15); title.setTypeface(null, android.graphics.Typeface.BOLD); toolbar.addView(title, new LinearLayout.LayoutParams(0, dp(52), 1));
        Button logout = new Button(this); logout.setText("Выйти"); logout.setTextSize(12); logout.setTextColor(Color.WHITE); logout.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(37, 57, 72))); logout.setOnClickListener(v -> logout()); toolbar.addView(logout, new LinearLayout.LayoutParams(-2, dp(42)));
        root.addView(toolbar);
        ProgressBar progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal); root.addView(progress, new LinearLayout.LayoutParams(-1, dp(2)));
        webView = new WebView(this); webView.getSettings().setJavaScriptEnabled(true); webView.getSettings().setDomStorageEnabled(true); webView.getSettings().setSupportZoom(false); webView.setBackgroundColor(Color.WHITE);
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                android.net.Uri uri = request.getUrl();
                if ("sib-trade55.ru".equals(uri.getHost()) || "www.sib-trade55.ru".equals(uri.getHost())) return false;
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) { progress.setVisibility(android.view.View.VISIBLE); }
            @Override public void onPageFinished(WebView view, String url) { progress.setVisibility(android.view.View.GONE); }
        });
        root.addView(webView, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);
        CookieManager cookies = CookieManager.getInstance(); cookies.setAcceptCookie(true);
        cookies.setCookie(AdminApi.BASE_URL, "sib_trade_session=" + cookie + "; Path=/; Max-Age=604800; Secure; HttpOnly; SameSite=Lax", ignored -> { cookies.flush(); webView.loadUrl(AdminApi.BASE_URL + safeAdminPath(getIntent().getStringExtra("admin_path"))); });
    }

    private String safeAdminPath(String path) { return path != null && path.matches("^/admin(?:/[a-zA-Z0-9_-]+)*$") ? path : "/admin"; }
    private void askNotificationPermission() { if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 10); }

    @Override protected void onResume() {
        super.onResume();
        foregroundPoll = new Runnable() { @Override public void run() { executor.execute(() -> { try { RequestNotifications.poll(MainActivity.this); } catch (Exception ignored) {} }); handler.postDelayed(this, 60_000); } };
        handler.post(foregroundPoll);
    }
    @Override protected void onPause() { super.onPause(); if (foregroundPoll != null) handler.removeCallbacks(foregroundPoll); }
    @Override protected void onNewIntent(Intent intent) { super.onNewIntent(intent); setIntent(intent); if (webView != null) webView.loadUrl(AdminApi.BASE_URL + safeAdminPath(intent.getStringExtra("admin_path"))); }
    @Override public void onBackPressed() { if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }

    private void logout() {
        RequestNotifications.cancel(this); SecureStore.clear(this); CookieManager.getInstance().removeAllCookies(ignored -> CookieManager.getInstance().flush());
        openLogin();
    }
    private void openLogin() { startActivity(new Intent(this, LoginActivity.class)); finish(); }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    @Override protected void onDestroy() { super.onDestroy(); if (webView != null) { webView.stopLoading(); webView.destroy(); } executor.shutdown(); }
}
