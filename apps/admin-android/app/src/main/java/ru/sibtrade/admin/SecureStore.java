package ru.sibtrade.admin;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

final class SecureStore {
    private static final String FILE = "admin_session";
    private SecureStore() {}

    private static SharedPreferences preferences(Context context) throws Exception {
        MasterKey masterKey = new MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();
        return EncryptedSharedPreferences.create(context, FILE, masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
    }

    static String get(Context context, String key) {
        try { return preferences(context).getString(key, null); }
        catch (Exception error) { return null; }
    }

    static void put(Context context, String key, String value) throws Exception {
        preferences(context).edit().putString(key, value).apply();
    }

    static void clear(Context context) {
        try { preferences(context).edit().clear().apply(); }
        catch (Exception ignored) {}
    }
}
