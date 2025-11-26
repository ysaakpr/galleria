use std::sync::Arc;
use tokio::sync::Mutex;
use tiny_http::{Response, Server};

#[derive(Clone, Debug)]
pub struct OAuthServer {
    token: Arc<Mutex<Option<String>>>,
}

impl OAuthServer {
    pub fn new() -> Self {
        Self {
            token: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn start_and_wait(&self) -> Result<String, String> {
        let server = Server::http("127.0.0.1:8765")
            .map_err(|e| format!("Failed to start OAuth server: {}", e))?;

        println!("✅ OAuth server started on http://127.0.0.1:8765");
        println!("⏳ Waiting for OAuth callback...");

        let token_clone = self.token.clone();

        // Handle one request
        for request in server.incoming_requests() {
            let url = request.url().to_string();
            println!("📥 Received request: {}", url);
            
            // Parse the callback URL - Google sends token in query params OR fragment
            if url == "/" {
                // This is the initial redirect from Google
                // Serve an HTML page that will extract the fragment and send it back
                println!("📄 Serving token extraction page");
                let html = r#"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Authenticating...</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            }
                            .container {
                                text-align: center;
                                background: white;
                                padding: 40px;
                                border-radius: 20px;
                                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            }
                            .spinner {
                                border: 4px solid #f3f3f3;
                                border-top: 4px solid #667eea;
                                border-radius: 50%;
                                width: 40px;
                                height: 40px;
                                animation: spin 1s linear infinite;
                                margin: 0 auto 20px;
                            }
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="spinner"></div>
                            <h1>Authenticating...</h1>
                            <p>Please wait while we complete your login.</p>
                        </div>
                        <script>
                            // Extract token from URL fragment
                            const hash = window.location.hash.substring(1);
                            const params = new URLSearchParams(hash);
                            const token = params.get('id_token') || params.get('access_token');
                            
                            if (token) {
                                // Send token back to server as query parameter
                                window.location.href = '/?token=' + encodeURIComponent(token);
                            } else {
                                document.body.innerHTML = '<div class="container"><h1>Error</h1><p>No token found in callback</p></div>';
                            }
                        </script>
                    </body>
                    </html>
                "#;

                let response = Response::from_string(html)
                    .with_header(
                        tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..])
                            .unwrap(),
                    );

                let _ = request.respond(response);
                continue; // Wait for the next request with the token
                
            } else if url.contains("?") {
                // This is the second request with the token
                let token = extract_token_from_url(&url);
                
                if let Some(token) = token {
                    println!("✅ Token extracted successfully!");
                    *token_clone.lock().await = Some(token.clone());

                    // Send success response
                    let html = r#"
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Login Successful</title>
                            <style>
                                body {
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    height: 100vh;
                                    margin: 0;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                }
                                .container {
                                    text-align: center;
                                    background: white;
                                    padding: 40px;
                                    border-radius: 20px;
                                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                                }
                                .success-icon {
                                    width: 80px;
                                    height: 80px;
                                    margin: 0 auto 20px;
                                    border-radius: 50%;
                                    background: #10b981;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                }
                                .checkmark {
                                    color: white;
                                    font-size: 48px;
                                }
                                h1 { color: #1f2937; margin: 0 0 10px 0; }
                                p { color: #6b7280; margin: 0; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="success-icon">
                                    <div class="checkmark">✓</div>
                                </div>
                                <h1>Login Successful!</h1>
                                <p>You can close this window and return to Galleria.</p>
                            </div>
                            <script>
                                setTimeout(() => window.close(), 3000);
                            </script>
                        </body>
                        </html>
                    "#;

                    let response = Response::from_string(html)
                        .with_header(
                            tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..])
                                .unwrap(),
                        );

                    let _ = request.respond(response);

                    return Ok(token);
                } else {
                    // Token not found in URL
                    println!("❌ Token not found in URL: {}", url);
                    let error_html = r#"
                        <!DOCTYPE html>
                        <html>
                        <head><title>Login Failed</title></head>
                        <body>
                            <h1>Login Failed</h1>
                            <p>Could not extract token from callback URL.</p>
                        </body>
                        </html>
                    "#;

                    let response = Response::from_string(error_html);
                    let _ = request.respond(response);

                    return Err("Token not found in callback URL".to_string());
                }
            }
        }

        Err("OAuth server stopped unexpectedly".to_string())
    }
}

fn extract_token_from_url(url: &str) -> Option<String> {
    // Parse URL query parameters
    // Format: /?id_token=xxx or /?access_token=xxx or fragment: #id_token=xxx or ?code=xxx
    
    println!("🔍 Extracting token from: {}", url);
    
    // Try query parameters first
    if let Some(query) = url.split('?').nth(1) {
        let query_part = query.split('#').next().unwrap_or(query);
        println!("📝 Query params: {}", query_part);
        for param in query_part.split('&') {
            if let Some((key, value)) = param.split_once('=') {
                println!("  - {} = {}", key, &value[..value.len().min(20)]);
                if key == "token" || key == "id_token" || key == "access_token" || key == "code" {
                    println!("✅ Found token in query: {}", key);
                    return Some(urlencoding::decode(value).unwrap_or_default().to_string());
                }
            }
        }
    }

    // Try fragment (after #) - Google OAuth implicit flow uses this
    if let Some(fragment) = url.split('#').nth(1) {
        println!("📝 Fragment params: {}", fragment);
        for param in fragment.split('&') {
            if let Some((key, value)) = param.split_once('=') {
                println!("  - {} = {}", key, &value[..value.len().min(20)]);
                if key == "id_token" || key == "access_token" {
                    println!("✅ Found token in fragment: {}", key);
                    return Some(urlencoding::decode(value).unwrap_or_default().to_string());
                }
            }
        }
    }

    println!("❌ No token found");
    None
}

pub fn build_oauth_url(client_id: &str) -> String {
    let redirect_uri = "http://127.0.0.1:8765";
    let scope = "openid email profile https://www.googleapis.com/auth/drive.file";
    
    format!(
        "https://accounts.google.com/o/oauth2/v2/auth?\
         client_id={}&\
         redirect_uri={}&\
         response_type=token&\
         scope={}&\
         prompt=select_account",
        client_id,
        urlencoding::encode(redirect_uri),
        urlencoding::encode(scope)
    )
}

