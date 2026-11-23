package com.rubikguide.app;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.Locale;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;

/** Vỏ ứng dụng: hiển thị nội dung hướng dẫn (HTML/JS trong assets/www) bằng WebView. Mọi thứ chạy offline, trừ Trợ lý Claude (tuỳ chọn, cần mạng). */
public class MainActivity extends Activity {

    // Nội dung được phục vụ từ assets/www qua một địa chỉ https nội bộ (không ra mạng):
    // trình duyệt chỉ cho trang web dùng camera khi trang chạy trên https.
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String ASSET_BASE = "https://" + ASSET_HOST + "/";
    private static final int REQ_CAMERA = 1;
    private static final String[] CAMERA_ONLY = { PermissionRequest.RESOURCE_VIDEO_CAPTURE };

    private WebView web;
    private PermissionRequest pendingCamera;

    // Giọng đọc tiếng Việt của máy (dùng offline nếu máy đã có dữ liệu giọng nói)
    private TextToSpeech tts;
    private volatile String ttsStatus = "loading"; // loading | ready | nolang | error
    private String waitingText;
    private int waitingId;

    /** Cầu nối cho speech.js: window.AndroidTTS */
    private final class TtsBridge {
        @JavascriptInterface
        public String status() {
            return ttsStatus;
        }

        @JavascriptInterface
        public void speak(String text, int id) {
            synchronized (MainActivity.this) {
                if ("loading".equals(ttsStatus)) { // máy chưa khởi động xong bộ đọc: đọc ngay khi sẵn sàng
                    waitingText = text;
                    waitingId = id;
                    return;
                }
            }
            if ("ready".equals(ttsStatus)) {
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, String.valueOf(id));
            } else {
                speechEnded(String.valueOf(id));
            }
        }

        @JavascriptInterface
        public void stop() {
            synchronized (MainActivity.this) {
                waitingText = null;
            }
            if ("ready".equals(ttsStatus)) tts.stop();
        }
    }

    private void speechEnded(String utteranceId) {
        final int id;
        try {
            id = Integer.parseInt(utteranceId);
        } catch (NumberFormatException e) {
            return;
        }
        runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript("window.Speech&&Speech._end(" + id + ")", null);
        });
    }

    private void startTts() {
        tts = new TextToSpeech(this, status -> {
            String result = "error";
            if (status == TextToSpeech.SUCCESS) {
                int lang = tts.setLanguage(new Locale("vi", "VN"));
                result = (lang == TextToSpeech.LANG_MISSING_DATA || lang == TextToSpeech.LANG_NOT_SUPPORTED)
                        ? "nolang" : "ready";
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override
                    public void onStart(String utteranceId) { }

                    @Override
                    public void onDone(String utteranceId) {
                        speechEnded(utteranceId);
                    }

                    @Override
                    public void onError(String utteranceId) {
                        speechEnded(utteranceId);
                    }
                });
            }
            String text;
            int id;
            synchronized (MainActivity.this) {
                ttsStatus = result;
                text = waitingText;
                id = waitingId;
                waitingText = null;
            }
            if (text != null) {
                if ("ready".equals(result)) tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, String.valueOf(id));
                else speechEnded(String.valueOf(id));
            }
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(getColor(R.color.app_bg));
        // Từ Android 15 app vẽ tràn dưới thanh trạng thái/điều hướng: chừa lề cho nội dung.
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Insets i = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                v.setPadding(i.left, i.top, i.right, i.bottom);
            } else {
                v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });

        web = new WebView(this);
        web.setBackgroundColor(getColor(R.color.app_bg));
        web.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true); // lưu tiến độ học
        settings.setAllowFileAccess(false);  // assets vẫn truy cập được qua file:///android_asset
        settings.setAllowContentAccess(false);
        settings.setTextZoom(100);
        settings.setMediaPlaybackRequiresUserGesture(false); // cho phép hiện ngay hình từ camera
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Chỉ cho phép các trang nằm trong app
                return !request.getUrl().toString().startsWith(ASSET_BASE);
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!ASSET_HOST.equals(uri.getHost())) return null;
                return openAsset(uri.getPath());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                boolean wantsCamera = false;
                for (String r : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) wantsCamera = true;
                }
                if (!wantsCamera || !ASSET_HOST.equals(request.getOrigin().getHost())) {
                    request.deny();
                    return;
                }
                if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                    request.grant(CAMERA_ONLY);
                } else {
                    if (pendingCamera != null) pendingCamera.deny();
                    pendingCamera = request;
                    requestPermissions(new String[] { Manifest.permission.CAMERA }, REQ_CAMERA);
                }
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (request == pendingCamera) pendingCamera = null;
            }
        });

        web.addJavascriptInterface(new TtsBridge(), "AndroidTTS");
        startTts();

        root.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(ASSET_BASE + "index.html");
        }
    }

    /** Trả file trong assets/www cho địa chỉ https nội bộ của app. */
    private WebResourceResponse openAsset(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
        String mime = "application/octet-stream";
        if (path.endsWith(".html")) mime = "text/html";
        else if (path.endsWith(".js")) mime = "text/javascript";
        else if (path.endsWith(".css")) mime = "text/css";
        else if (path.endsWith(".svg")) mime = "image/svg+xml";
        else if (path.endsWith(".png")) mime = "image/png";
        try {
            if (path.contains("..")) throw new IOException("Đường dẫn không hợp lệ");
            return new WebResourceResponse(mime, "utf-8", getAssets().open("www" + path));
        } catch (IOException e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                    Collections.<String, String>emptyMap(), new ByteArrayInputStream(new byte[0]));
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_CAMERA || pendingCamera == null) return;
        PermissionRequest request = pendingCamera;
        pendingCamera = null;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            request.grant(CAMERA_ONLY);
        } else {
            request.deny();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if ("ready".equals(ttsStatus)) tts.stop(); // rời app thì ngừng đọc
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        web.destroy();
        super.onDestroy();
    }
}
